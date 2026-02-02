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

    const now = new Date().toISOString();

    const { error } = await supabase
      .from("profiles")
      .update({
        onboarding_completed: true,
        onboarding_completed_at: now,
        onboarding_current_step: "completed",
        updated_at: now,
      })
      .eq("id", user.id);

    if (error) {
      logger.error("Error completing onboarding", error as Error);
      return NextResponse.json(
        { error: "Failed to complete onboarding" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      completed_at: now,
    });
  } catch (error) {
    logger.error("Error in onboarding complete", error as Error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
