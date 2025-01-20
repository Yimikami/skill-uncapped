import { NextResponse } from "next/server";

let progressMap = new Map<string, number>();

export function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const progress = progressMap.get(id) || 0;
  return NextResponse.json({ progress });
}

// Helper functions to manage progress
export function setProgress(id: string, value: number) {
  progressMap.set(id, value);
}

export function clearProgress(id: string) {
  progressMap.delete(id);
}
