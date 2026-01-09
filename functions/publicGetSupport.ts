import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Public API: Get support threads for a workspace (read-only preview)
 * Endpoint: /api/public/support
 * Method: POST
 * Auth: None required
 * 
 * NOTE: This endpoint returns EMPTY for public viewers.
 * Support is inherently authenticated - users must login to view/create threads.
 * 
 * Request: {
 *   workspace_id: string
 * }
 * 
 * Response: {
 *   enabled: boolean,
 *   requires_auth: true,
 *   message: string
 * }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { workspace_id } = payload;

    if (!workspace_id) {
      return Response.json({ error: 'workspace_id is required' }, { status: 400 });
    }

    // Verify workspace is public
    const workspaces = await base44.asServiceRole.entities.Workspace.filter({ 
      id: workspace_id, 
      visibility: 'public',
      status: 'active' 
    });

    if (workspaces.length === 0) {
      return Response.json({ error: 'Workspace not found or not public' }, { status: 404 });
    }

    const workspace = workspaces[0];

    // Support is always authenticated-only
    return Response.json({
      enabled: workspace.support_enabled || false,
      requires_auth: true,
      message: 'Support threads require authentication. Please login to access support.'
    });

  } catch (error) {
    console.error('Public support fetch error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});