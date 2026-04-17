import { NextRequest, NextResponse } from "next/server";
import { getOnCell, CLAW_AGENT_CODE } from "@/lib/oncell";

export async function POST(req: NextRequest) {
  try {
    const { user_id } = await req.json();
    if (!user_id) return NextResponse.json({ error: "user_id required" }, { status: 400 });

    const oncell = getOnCell();
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });

    const cell = await oncell.cells.create({
      customerId: "claw-" + user_id,
      tier: "starter",
      permanent: true,
      agent: CLAW_AGENT_CODE,
      secrets: { ANTHROPIC_API_KEY: anthropicKey },
    });

    return NextResponse.json({ cell_id: cell.id, status: "active" });
  } catch (err: any) {
    console.error("launch error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
