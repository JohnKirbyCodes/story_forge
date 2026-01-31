import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkNodeLimit } from "@/lib/subscription/limits";
import { createStoryNodeSchema, validateRequest } from "@/lib/validation/schemas";
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
    const validation = validateRequest(createStoryNodeSchema, body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { name, description, node_type, project_id, position_x, position_y } = validation.data;

    // Use admin client for limit checking and creation
    const adminSupabase = createAdminClient();

    // Verify user owns the project
    const { data: project, error: projectError } = await adminSupabase
      .from("projects")
      .select("id, user_id")
      .eq("id", project_id)
      .single();

    if (projectError || !project || project.user_id !== user.id) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check story node limit
    const limitCheck = await checkNodeLimit(adminSupabase, user.id, project_id);
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

    // Create the story node
    const { data, error } = await adminSupabase
      .from("story_nodes")
      .insert({
        name,
        description: description || null,
        node_type,
        project_id,
        position_x: position_x ?? Math.random() * 500,
        position_y: position_y ?? Math.random() * 500,
      })
      .select()
      .single();

    if (error) {
      logger.error("Failed to create story node", error);
      return NextResponse.json(
        { error: "Failed to create story node" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    logger.error("Story node creation failed", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
