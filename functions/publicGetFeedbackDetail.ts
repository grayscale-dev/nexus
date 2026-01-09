import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Public API: Get single feedback item details
 * Endpoint: /api/public/feedback/:id
 * Method: POST
 * Auth: None required
 * 
 * Request: {
 *   feedback_id: string,
 *   workspace_id: string
 * }
 * 
 * Response: {
 *   id: string,
 *   workspace_id: string,
 *   title: string,
 *   type: string,
 *   description: string,
 *   steps_to_reproduce?: string,
 *   expected_behavior?: string,
 *   actual_behavior?: string,
 *   status: string,
 *   tags: string[],
 *   vote_count: number,
 *   created_date: string,
 *   submitter_email: string (anonymized),
 *   responses: Array<{
 *     id: string,
 *     content: string,
 *     is_official: boolean,
 *     created_date: string,
 *     author_email: string (anonymized or team name)
 *   }>
 * }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { feedback_id, workspace_id } = payload;

    if (!feedback_id || !workspace_id) {
      return Response.json({ error: 'feedback_id and workspace_id are required' }, { status: 400 });
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

    // Fetch feedback item
    const feedbackItems = await base44.asServiceRole.entities.Feedback.filter({ 
      id: feedback_id,
      workspace_id,
      visibility: 'public'
    });

    if (feedbackItems.length === 0) {
      return Response.json({ error: 'Feedback not found or not public' }, { status: 404 });
    }

    const feedback = feedbackItems[0];

    // Fetch responses
    const responses = await base44.asServiceRole.entities.FeedbackResponse.filter({
      feedback_id,
      workspace_id
    }, 'created_date');

    // Return whitelisted fields
    return Response.json({
      id: feedback.id,
      workspace_id: feedback.workspace_id,
      title: feedback.title,
      type: feedback.type,
      description: feedback.description,
      steps_to_reproduce: feedback.steps_to_reproduce || '',
      expected_behavior: feedback.expected_behavior || '',
      actual_behavior: feedback.actual_behavior || '',
      status: feedback.status,
      tags: feedback.tags || [],
      vote_count: feedback.vote_count || 0,
      created_date: feedback.created_date,
      submitter_email: anonymizeEmail(feedback.submitter_email),
      responses: responses.map(r => ({
        id: r.id,
        content: r.content,
        is_official: r.is_official || false,
        created_date: r.created_date,
        author_email: r.is_official 
          ? `${workspaces[0].name} Team` 
          : anonymizeEmail(r.author_email || feedback.submitter_email)
      }))
    });

  } catch (error) {
    console.error('Public feedback detail fetch error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});

function anonymizeEmail(email) {
  if (!email) return 'Anonymous';
  const [user, domain] = email.split('@');
  if (user.length <= 2) return `${user[0]}***@${domain}`;
  return `${user.substring(0, 2)}***@${domain}`;
}