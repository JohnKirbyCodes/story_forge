import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        onboarding_completed: false,
        onboarding_completed_at: null,
        onboarding_current_step: "welcome",
        onboarding_skipped_at: null,
        onboarding_banner_dismissed: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      logger.error("Error resetting onboarding", error as Error);
      return NextResponse.json(
        { error: "Failed to reset onboarding" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Onboarding has been reset. Refresh the page to start again.",
    });
  } catch (error) {
    logger.error("Error in onboarding reset", error as Error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
