import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

interface SkipRequest {
  currentStep?: string;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: SkipRequest = await request.json().catch(() => ({}));
    const now = new Date().toISOString();

    const { error } = await supabase
      .from("profiles")
      .update({
        onboarding_skipped_at: now,
        onboarding_current_step: body.currentStep || "skipped",
        updated_at: now,
      })
      .eq("id", user.id);

    if (error) {
      console.error("Error skipping onboarding:", error);
      return NextResponse.json(
        { error: "Failed to skip onboarding" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      skipped_at: now,
    });
  } catch (error) {
    console.error("Error in onboarding skip:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
