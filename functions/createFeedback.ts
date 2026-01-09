import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { authorizeWriteAction } from './authHelpers.js';

/**
 * Create feedback item
 * Endpoint: POST /api/feedback/create
 * Auth: Required - Contributor role minimum
 * 
 * Request: {
 *   workspace_id: string,
 *   title: string,
 *   type: string,
 *   description: string,
 *   steps_to_reproduce?: string,
 *   expected_behavior?: string,
 *   actual_behavior?: string,
 *   attachments?: array
 * }
 * 
 * Response: { id: string, ...feedback }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { workspace_id, title, type, description, steps_to_reproduce, expected_behavior, actual_behavior, attachments } = payload;

    // Validate input
    if (!workspace_id || !title || !type || !description) {
      return Response.json({ 
        error: 'Missing required fields',
        code: 'INVALID_INPUT',
        required: ['workspace_id', 'title', 'type', 'description']
      }, { status: 400 });
    }

    // Authorize write action
    const auth = await authorizeWriteAction(base44, workspace_id, 'contributor');
    if (!auth.success) {
      return auth.error;
    }

    // Create feedback
    const feedback = await base44.entities.Feedback.create({
      workspace_id,
      title,
      type,
      description,
      steps_to_reproduce: steps_to_reproduce || '',
      expected_behavior: expected_behavior || '',
      actual_behavior: actual_behavior || '',
      attachments: attachments || [],
      status: 'open',
      visibility: auth.workspace.settings?.default_feedback_visibility || 'public',
      tags: [],
      vote_count: 0,
      submitter_id: auth.user.id,
      submitter_email: auth.user.email
    });

    return Response.json(feedback);

  } catch (error) {
    console.error('Create feedback error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});