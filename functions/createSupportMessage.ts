import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { authorizeWriteAction, requireStaff } from './authHelpers.js';

/**
 * Create support message/reply
 * Endpoint: POST /api/support/reply
 * Auth: Required - Contributor role minimum
 * 
 * Request: {
 *   thread_id: string,
 *   workspace_id: string,
 *   content: string,
 *   is_internal_note?: boolean,
 *   attachments?: array
 * }
 * 
 * Response: { id: string, ...message }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { thread_id, workspace_id, content, is_internal_note, attachments } = payload;

    // Validate input
    if (!thread_id || !workspace_id || !content) {
      return Response.json({ 
        error: 'Missing required fields',
        code: 'INVALID_INPUT',
        required: ['thread_id', 'workspace_id', 'content']
      }, { status: 400 });
    }

    // Authorize write action
    const auth = await authorizeWriteAction(base44, workspace_id, 'contributor');
    if (!auth.success) {
      return auth.error;
    }

    // Fetch thread to verify access
    const threads = await base44.entities.SupportThread.filter({
      id: thread_id,
      workspace_id
    });

    if (threads.length === 0) {
      return Response.json({ error: 'Thread not found', code: 'NOT_FOUND' }, { status: 404 });
    }

    const thread = threads[0];

    // Check permissions
    const staffCheck = await requireStaff(base44, workspace_id, auth.user.id);
    const isStaff = staffCheck.success;

    // Non-staff can only reply to their own threads
    if (!isStaff && thread.requester_id !== auth.user.id) {
      return Response.json({
        error: 'Forbidden',
        code: 'FORBIDDEN',
        message: 'You can only reply to your own support threads'
      }, { status: 403 });
    }

    // Internal notes require staff
    if (is_internal_note && !isStaff) {
      return Response.json({
        error: 'Forbidden',
        code: 'FORBIDDEN',
        message: 'Only staff can create internal notes'
      }, { status: 403 });
    }

    // Create message
    const message = await base44.entities.SupportMessage.create({
      thread_id,
      workspace_id,
      content,
      author_id: auth.user.id,
      author_email: auth.user.email,
      is_internal_note: is_internal_note || false,
      is_staff_reply: isStaff,
      attachments: attachments || []
    });

    // Update thread
    await base44.entities.SupportThread.update(thread_id, {
      last_message_at: new Date().toISOString(),
      message_count: (thread.message_count || 0) + 1,
      status: isStaff ? 'awaiting_user' : 'awaiting_support'
    });

    return Response.json(message);

  } catch (error) {
    console.error('Create support message error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});