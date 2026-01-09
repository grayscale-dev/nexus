import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { authorizeWriteAction } from './authHelpers.js';

/**
 * Update roadmap item
 * Endpoint: POST /api/roadmap/update
 * Auth: Required - Support role minimum (staff only)
 * 
 * Request: {
 *   item_id: string,
 *   workspace_id: string,
 *   updates: object
 * }
 * 
 * Response: { id: string, ...item }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { item_id, workspace_id, updates } = payload;

    // Validate input
    if (!item_id || !workspace_id || !updates) {
      return Response.json({ 
        error: 'Missing required fields',
        code: 'INVALID_INPUT',
        required: ['item_id', 'workspace_id', 'updates']
      }, { status: 400 });
    }

    // Authorize write action - staff only
    const auth = await authorizeWriteAction(base44, workspace_id, 'support');
    if (!auth.success) {
      return auth.error;
    }

    // Update roadmap item
    const updated = await base44.entities.RoadmapItem.update(item_id, updates);

    return Response.json(updated);

  } catch (error) {
    console.error('Update roadmap item error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});