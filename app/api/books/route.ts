import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkBookLimit } from "@/lib/subscription/limits";
import { checkApiRateLimit, createRateLimitResponse, RATE_LIMIT_IDS } from "@/lib/security/rate-limit";
import { logger } from "@/lib/logger";

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
    const { title, subtitle, synopsis, target_word_count, project_id } = body;

    if (!title || !project_id) {
      return NextResponse.json(
        { error: "Title and project_id are required" },
        { status: 400 }
      );
    }

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

    // Check book limit
    const limitCheck = await checkBookLimit(adminSupabase, user.id, project_id);
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

    // Create the book
    const { data, error } = await adminSupabase
      .from("books")
      .insert({
        title,
        subtitle: subtitle || null,
        synopsis: synopsis || null,
        target_word_count: target_word_count || null,
        project_id,
        status: "draft",
      })
      .select()
      .single();

    if (error) {
      logger.error("Error creating book", error as Error);
      return NextResponse.json(
        { error: "Failed to create book" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    logger.error("Error in book creation", error as Error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
