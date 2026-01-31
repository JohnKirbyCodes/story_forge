import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkProjectLimit } from "@/lib/subscription/limits";
import { createProjectSchema, validateRequest } from "@/lib/validation/schemas";
import { logger } from "@/lib/logger";
import { checkApiRateLimit, createRateLimitResponse, RATE_LIMIT_IDS } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit content creation
    const { rateLimited } = await checkApiRateLimit(RATE_LIMIT_IDS.CONTENT_WRITE, {
      request,
      rateLimitKey: user.id,
    });
    if (rateLimited) {
      return createRateLimitResponse();
    }

    const body = await request.json();
    const validation = validateRequest(createProjectSchema, body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { title, description, genre } = validation.data;

    // Use admin client for limit checking and creation
    const adminSupabase = createAdminClient();

    // Check project limit
    const limitCheck = await checkProjectLimit(adminSupabase, user.id);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: "limit_exceeded",
          message: limitCheck.message,
          current: limitCheck.current,
          limit: limitCheck.limit,
        },
        { status: 403 }
      );
    }

    // Create the project
    const { data, error } = await adminSupabase
      .from("projects")
      .insert({
        title,
        description: description || null,
        genre: genre || null,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      logger.error("Failed to create project", error);
      return NextResponse.json(
        { error: "Failed to create project" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    logger.error("Project creation failed", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
