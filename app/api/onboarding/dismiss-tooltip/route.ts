import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

interface DismissTooltipRequest {
  tooltipId: string;
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

    const { tooltipId }: DismissTooltipRequest = await request.json();

    if (!tooltipId) {
      return NextResponse.json(
        { error: "Tooltip ID is required" },
        { status: 400 }
      );
    }

    // Get current dismissed tooltips
    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("tooltips_dismissed")
      .eq("id", user.id)
      .single();

    if (fetchError) {
      logger.error("Error fetching profile", fetchError as Error);
      return NextResponse.json(
        { error: "Failed to fetch profile" },
        { status: 500 }
      );
    }

    const currentDismissed = profile?.tooltips_dismissed || [];

    // Only add if not already dismissed
    if (currentDismissed.includes(tooltipId)) {
      return NextResponse.json({ success: true, already_dismissed: true });
    }

    const updatedDismissed = [...currentDismissed, tooltipId];

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        tooltips_dismissed: updatedDismissed,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      logger.error("Error dismissing tooltip", updateError as Error);
      return NextResponse.json(
        { error: "Failed to dismiss tooltip" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      tooltips_dismissed: updatedDismissed,
    });
  } catch (error) {
    logger.error("Error in dismiss tooltip", error as Error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
