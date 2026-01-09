import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { authorizeWriteAction } from './authHelpers.js';

/**
 * Create doc page comment/question
 * Endpoint: POST /api/docs/comment
 * Auth: Required - Contributor role minimum
 * 
 * Request: {
 *   doc_page_id: string,
 *   workspace_id: string,
 *   content: string,
 *   is_question?: boolean
 * }
 * 
 * Response: { id: string, ...comment }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { doc_page_id, workspace_id, content, is_question } = payload;

    // Validate input
    if (!doc_page_id || !workspace_id || !content) {
      return Response.json({ 
        error: 'Missing required fields',
        code: 'INVALID_INPUT',
        required: ['doc_page_id', 'workspace_id', 'content']
      }, { status: 400 });
    }

    // Authorize write action
    const auth = await authorizeWriteAction(base44, workspace_id, 'contributor');
    if (!auth.success) {
      return auth.error;
    }

    // Create comment
    const comment = await base44.entities.DocComment.create({
      workspace_id,
      doc_page_id,
      content,
      author_id: auth.user.id,
      author_email: auth.user.email,
      is_question: is_question !== undefined ? is_question : true,
      is_answered: false
    });

    return Response.json(comment);

  } catch (error) {
    console.error('Create doc comment error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});