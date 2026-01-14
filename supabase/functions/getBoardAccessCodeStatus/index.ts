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

    const { data, error } = await supabaseAdmin
      .from("board_access_codes")
      .select("expires_at, created_at")
      .eq("board_id", boardId)
      .maybeSingle();

    if (error) {
      console.error("Access code lookup error:", error);
      return new Response(JSON.stringify({ error: "Failed to load access code" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        has_code: Boolean(data),
        expires_at: data?.expires_at ?? null,
        created_at: data?.created_at ?? null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Access code status error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
