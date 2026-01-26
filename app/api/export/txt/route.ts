import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bookId = searchParams.get("bookId");

    if (!bookId) {
      return NextResponse.json({ error: "bookId is required" }, { status: 400 });
    }

    // Verify user is authenticated
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminSupabase = createAdminClient();

    // Get book with project to verify ownership
    const { data: book, error: bookError } = await adminSupabase
      .from("books")
      .select(`
        id,
        title,
        subtitle,
        projects!inner (
          id,
          user_id,
          title
        )
      `)
      .eq("id", bookId)
      .single();

    if (bookError || !book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const project = book.projects as { id: string; user_id: string; title: string };
    if (project.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all chapters ordered by sort order
    const { data: chapters, error: chaptersError } = await adminSupabase
      .from("chapters")
      .select(`
        id,
        title,
        sort_order,
        order_index
      `)
      .eq("book_id", bookId)
      .order("sort_order", { ascending: true });

    if (chaptersError) {
      return NextResponse.json({ error: "Failed to fetch chapters" }, { status: 500 });
    }

    // Get all scenes for these chapters
    const chapterIds = chapters?.map((c) => c.id) || [];
    const { data: scenes, error: scenesError } = await adminSupabase
      .from("scenes")
      .select(`
        id,
        chapter_id,
        title,
        generated_prose,
        edited_prose,
        sort_order,
        order_index
      `)
      .in("chapter_id", chapterIds)
      .order("sort_order", { ascending: true });

    if (scenesError) {
      return NextResponse.json({ error: "Failed to fetch scenes" }, { status: 500 });
    }

    // Build the export text
    let exportText = "";

    // Title page
    exportText += `${book.title.toUpperCase()}\n`;
    if (book.subtitle) {
      exportText += `${book.subtitle}\n`;
    }
    exportText += "\n";
    exportText += `From: ${project.title}\n`;
    exportText += "\n";
    exportText += "=".repeat(50) + "\n\n";

    // Process each chapter
    const sortedChapters = (chapters || []).sort(
      (a, b) => (a.sort_order || a.order_index || 0) - (b.sort_order || b.order_index || 0)
    );

    for (let i = 0; i < sortedChapters.length; i++) {
      const chapter = sortedChapters[i];

      // Chapter header
      exportText += `CHAPTER ${i + 1}`;
      if (chapter.title) {
        exportText += `: ${chapter.title}`;
      }
      exportText += "\n\n";

      // Get scenes for this chapter
      const chapterScenes = (scenes || [])
        .filter((s) => s.chapter_id === chapter.id)
        .sort((a, b) => (a.sort_order || a.order_index || 0) - (b.sort_order || b.order_index || 0));

      for (let j = 0; j < chapterScenes.length; j++) {
        const scene = chapterScenes[j];

        // Use edited_prose if available, otherwise use generated_prose
        const prose = scene.edited_prose || scene.generated_prose;

        if (prose) {
          exportText += prose.trim();
          exportText += "\n\n";

          // Add scene break if not last scene in chapter
          if (j < chapterScenes.length - 1) {
            exportText += "* * *\n\n";
          }
        }
      }

      // Add chapter break
      if (i < sortedChapters.length - 1) {
        exportText += "\n" + "-".repeat(30) + "\n\n";
      }
    }

    // Add footer
    exportText += "\n" + "=".repeat(50) + "\n";
    exportText += "THE END\n";

    // Create filename
    const safeTitle = book.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const filename = `${safeTitle}.txt`;

    // Return as downloadable text file
    return new Response(exportText, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error exporting book:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
