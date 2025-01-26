import { NextResponse } from "next/server";

let championCache: { name: string }[] | null = null;

export async function GET() {
  try {
    if (championCache) {
      return NextResponse.json(championCache);
    }

    const response = await fetch(
      "https://www.skill-capped.com/api/riot/championDataBasic"
    );
    if (!response.ok) {
      throw new Error("Failed to fetch champions");
    }

    const data = await response.json();
    championCache = data.data;

    return NextResponse.json(championCache);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch champions" },
      { status: 500 }
    );
  }
}
