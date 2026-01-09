import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { authorizeWriteAction } from './authHelpers.js';

/**
 * Create support thread
 * Endpoint: POST /api/support/create
 * Auth: Required - Contributor role minimum
 * 
 * Request: {
 *   workspace_id: string,
 *   subject: string,
 *   message: string,
 *   priority?: string
 * }
 * 
 * Response: { thread: object, message: object }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { workspace_id, subject, message, priority } = payload;

    // Validate input
    if (!workspace_id || !subject || !message) {
      return Response.json({ 
        error: 'Missing required fields',
        code: 'INVALID_INPUT',
        required: ['workspace_id', 'subject', 'message']
      }, { status: 400 });
    }

    // Authorize write action
    const auth = await authorizeWriteAction(base44, workspace_id, 'contributor');
    if (!auth.success) {
      return auth.error;
    }

    // Check support is enabled
    if (!auth.workspace.support_enabled) {
      return Response.json({
        error: 'Support not enabled',
        code: 'SUPPORT_DISABLED',
        message: 'Support is not enabled for this workspace'
      }, { status: 403 });
    }

    // Create support thread
    const thread = await base44.entities.SupportThread.create({
      workspace_id,
      subject,
      status: 'open',
      priority: priority || 'medium',
      requester_id: auth.user.id,
      requester_email: auth.user.email,
      participants: [],
      feedback_ids: [],
      roadmap_item_ids: [],
      changelog_entry_ids: [],
      doc_page_ids: [],
      tags: [],
      last_message_at: new Date().toISOString(),
      message_count: 1
    });

    // Create first message
    const firstMessage = await base44.entities.SupportMessage.create({
      thread_id: thread.id,
      workspace_id,
      content: message,
      author_id: auth.user.id,
      author_email: auth.user.email,
      is_internal_note: false,
      is_staff_reply: false,
      attachments: []
    });

    return Response.json({ thread, message: firstMessage });

  } catch (error) {
    console.error('Create support thread error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});