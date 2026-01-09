import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { authorizeWriteAction, requireStaff } from './authHelpers.js';

/**
 * Update feedback item
 * Endpoint: POST /api/feedback/update
 * Auth: Required - Staff for status/priority, owner for content
 * 
 * Request: {
 *   feedback_id: string,
 *   workspace_id: string,
 *   updates: object
 * }
 * 
 * Response: { id: string, ...feedback }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { feedback_id, workspace_id, updates } = payload;

    // Validate input
    if (!feedback_id || !workspace_id || !updates) {
      return Response.json({ 
        error: 'Missing required fields',
        code: 'INVALID_INPUT',
        required: ['feedback_id', 'workspace_id', 'updates']
      }, { status: 400 });
    }

    // Authorize write action
    const auth = await authorizeWriteAction(base44, workspace_id, 'contributor');
    if (!auth.success) {
      return auth.error;
    }

    // Fetch existing feedback
    const feedbackItems = await base44.entities.Feedback.filter({
      id: feedback_id,
      workspace_id
    });

    if (feedbackItems.length === 0) {
      return Response.json({ error: 'Feedback not found', code: 'NOT_FOUND' }, { status: 404 });
    }

    const feedback = feedbackItems[0];

    // Check permissions for different update types
    const staffFields = ['status', 'priority', 'assigned_to', 'visibility'];
    const hasStaffUpdates = Object.keys(updates).some(key => staffFields.includes(key));

    if (hasStaffUpdates) {
      const staffCheck = await requireStaff(base44, workspace_id, auth.user.id);
      if (!staffCheck.success) {
        return staffCheck.error;
      }
    } else {
      // Non-staff can only update their own feedback
      if (feedback.submitter_id !== auth.user.id) {
        return Response.json({
          error: 'Forbidden',
          code: 'FORBIDDEN',
          message: 'You can only edit your own feedback'
        }, { status: 403 });
      }
    }

    // Update feedback
    const updated = await base44.entities.Feedback.update(feedback_id, updates);

    return Response.json(updated);

  } catch (error) {
    console.error('Update feedback error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});