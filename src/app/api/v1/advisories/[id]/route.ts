import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { acknowledgeAdvisory } from "@/server/services/advisoryService";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    const advisory = await acknowledgeAdvisory(id, user?.id);

    return NextResponse.json({
      success: true,
      message: `Advisory ${advisory.advisoryCode} marked as actioned by farmer.`,
      advisory,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to acknowledge advisory";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
