import { NextRequest, NextResponse } from "next/server";
import { getOnCell } from "@/lib/oncell";

export async function POST(req: NextRequest) {
  try {
    const { cell_id } = await req.json();
    if (!cell_id) return NextResponse.json({ error: "cell_id required" }, { status: 400 });

    const oncell = getOnCell();

    const [memory, files, history] = await Promise.all([
      oncell.cells.request<{ memory: string }>(cell_id, "get_memory"),
      oncell.cells.request<{ files: string[] }>(cell_id, "get_files"),
      oncell.cells.request<{ messages: any[] }>(cell_id, "get_history"),
    ]);

    return NextResponse.json({
      memory: memory.memory,
      files: files.files,
      messageCount: history.messages.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
