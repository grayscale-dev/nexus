import { requireAdmin, requireAuth, verifyBoard } from "../_shared/authHelpers.ts";
import { supabaseAdmin } from "../_shared/supabase.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    const authCheck = await requireAuth(req);
    if (!authCheck.success) {
      return new Response(authCheck.error.body, {
        status: authCheck.error.status,
        headers: corsHeaders,
      });
    }

    const payload = await req.json().catch(() => ({}));
    const boardId = payload.board_id;
    const enabled = Boolean(payload.enabled);

    if (!boardId) {
      return new Response(JSON.stringify({ error: "Missing board_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const boardCheck = await verifyBoard(boardId);
    if (!boardCheck.success) {
      return new Response(boardCheck.error.body, {
        status: boardCheck.error.status,
        headers: corsHeaders,
      });
    }

    const adminCheck = await requireAdmin(boardId, authCheck.user.id);
    if (!adminCheck.success) {
      return new Response(adminCheck.error.body, {
        status: adminCheck.error.status,
        headers: corsHeaders,
      });
    }

    const betaAccessAt = enabled ? new Date().toISOString() : null;

    const { error } = await supabaseAdmin.from("billing_customers").upsert({
      board_id: boardId,
      beta_access_granted_at: betaAccessAt,
    });

    if (error) {
      console.error("Beta access update error:", error);
      return new Response(JSON.stringify({ error: "Failed to update beta access" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ beta_access_granted_at: betaAccessAt }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Beta access handler error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
