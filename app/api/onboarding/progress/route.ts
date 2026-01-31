import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { OnboardingStep } from "@/lib/analytics/onboarding";

interface UpdateProgressRequest {
  step: OnboardingStep;
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { step }: UpdateProgressRequest = await request.json();

    if (!step) {
      return NextResponse.json(
        { error: "Step is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        onboarding_current_step: step,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      console.error("Error updating onboarding progress:", error);
      return NextResponse.json(
        { error: "Failed to update progress" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, step });
  } catch (error) {
    console.error("Error in onboarding progress:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
