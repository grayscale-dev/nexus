import { supabaseAdmin } from "../_shared/supabase.ts";
import { applyRateLimit, addNoCacheHeaders, RATE_LIMITS } from "../_shared/rateLimiter.ts";

Deno.serve(async (req) => {
  try {
    const rateLimitResponse = await applyRateLimit(req, RATE_LIMITS.SIGNUP);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json();
    const {
      email,
      estimated_daily_users,
      name,
      company,
      use_case,
      source,
      utm_source,
      utm_medium,
      utm_campaign,
      profile,
    } = body || {};

    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const estimatedDaily = Number(estimated_daily_users);

    if (!normalizedEmail || !Number.isInteger(estimatedDaily) || estimatedDaily < 1) {
      return Response.json(
        {
          error:
            "Missing required fields: email, estimated_daily_users",
        },
        { status: 400 },
      );
    }

    const normalizedProfile = profile && typeof profile === "object" ? profile : null;

    const { data: existing, error: lookupError } = await supabaseAdmin
      .from("waitlist_applications")
      .select("id")
      .ilike("email", normalizedEmail)
      .maybeSingle();

    if (lookupError) {
      console.error("Waitlist lookup error:", lookupError);
      return Response.json(
        { error: "Failed to submit waitlist signup" },
        { status: 500 },
      );
    }

    const payload = {
      email: normalizedEmail,
      estimated_daily_users: estimatedDaily,
      name: typeof name === "string" ? name.trim() : null,
      company: typeof company === "string" ? company.trim() : null,
      use_case: typeof use_case === "string" ? use_case.trim() : null,
      source: typeof source === "string" ? source.trim() : null,
      utm_source: typeof utm_source === "string" ? utm_source.trim() : null,
      utm_medium: typeof utm_medium === "string" ? utm_medium.trim() : null,
      utm_campaign: typeof utm_campaign === "string" ? utm_campaign.trim() : null,
      profile: normalizedProfile,
      status: "pending",
    };

    const { error: writeError } = existing?.id
      ? await supabaseAdmin
          .from("waitlist_applications")
          .update(payload)
          .eq("id", existing.id)
      : await supabaseAdmin
          .from("waitlist_applications")
          .insert(payload);

    if (writeError) {
      console.error("Waitlist signup error:", writeError);
      return Response.json(
        { error: "Failed to submit waitlist signup" },
        { status: 500 },
      );
    }

    const response = Response.json({
      success: true,
    });

    return addNoCacheHeaders(response);
  } catch (error) {
    console.error("Waitlist signup error:", error);
    return Response.json(
      { error: "Failed to submit waitlist signup" },
      { status: 500 },
    );
  }
});
