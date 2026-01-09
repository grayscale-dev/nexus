import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { authorizeWriteAction, requireStaff } from './authHelpers.js';

/**
 * Create feedback response/comment
 * Endpoint: POST /api/feedback/response
 * Auth: Required - Contributor role minimum
 * 
 * Request: {
 *   feedback_id: string,
 *   workspace_id: string,
 *   content: string,
 *   attachments?: array
 * }
 * 
 * Response: { id: string, ...response }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { feedback_id, workspace_id, content, attachments } = payload;

    // Validate input
    if (!feedback_id || !workspace_id || !content) {
      return Response.json({ 
        error: 'Missing required fields',
        code: 'INVALID_INPUT',
        required: ['feedback_id', 'workspace_id', 'content']
      }, { status: 400 });
    }

    // Authorize write action
    const auth = await authorizeWriteAction(base44, workspace_id, 'contributor');
    if (!auth.success) {
      return auth.error;
    }

    // Check if user is staff to mark as official
    const staffCheck = await requireStaff(base44, workspace_id, auth.user.id);
    const isOfficial = staffCheck.success;
    const authorRole = isOfficial ? 'support' : 'user';

    // Create response
    const response = await base44.entities.FeedbackResponse.create({
      feedback_id,
      workspace_id,
      content,
      is_official: isOfficial,
      author_id: auth.user.id,
      author_role: authorRole,
      attachments: attachments || []
    });

    return Response.json(response);

  } catch (error) {
    console.error('Create feedback response error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});