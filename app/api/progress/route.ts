import { NextResponse } from "next/server";
import { getProgress } from "@/utils/progress-utils";

export function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const progress = getProgress(id);
  return NextResponse.json({ progress });
}
