import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { authorizeWriteAction } from './authHelpers.js';

/**
 * Create roadmap item
 * Endpoint: POST /api/roadmap/create
 * Auth: Required - Support role minimum (staff only)
 * 
 * Request: {
 *   workspace_id: string,
 *   title: string,
 *   description?: string,
 *   status: string,
 *   target_date?: string,
 *   target_quarter?: string,
 *   visibility?: string
 * }
 * 
 * Response: { id: string, ...item }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { workspace_id, title, description, status, target_date, target_quarter, visibility } = payload;

    // Validate input
    if (!workspace_id || !title || !status) {
      return Response.json({ 
        error: 'Missing required fields',
        code: 'INVALID_INPUT',
        required: ['workspace_id', 'title', 'status']
      }, { status: 400 });
    }

    // Authorize write action - staff only
    const auth = await authorizeWriteAction(base44, workspace_id, 'support');
    if (!auth.success) {
      return auth.error;
    }

    // Create roadmap item
    const item = await base44.entities.RoadmapItem.create({
      workspace_id,
      title,
      description: description || '',
      status,
      target_date: target_date || null,
      target_quarter: target_quarter || null,
      visibility: visibility || 'public',
      tags: [],
      display_order: 0,
      linked_feedback_ids: []
    });

    return Response.json(item);

  } catch (error) {
    console.error('Create roadmap item error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});