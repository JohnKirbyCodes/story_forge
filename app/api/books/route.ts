import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkBookLimit } from "@/lib/subscription/limits";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      console.error("Error creating book:", error);
      return NextResponse.json(
        { error: "Failed to create book" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in book creation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
