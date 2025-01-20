import { NextResponse } from "next/server";
import { setProgress, clearProgress } from "@/utils/progress-utils";

async function findLastPart(videoId: string, quality: string): Promise<number> {
  let last = 0;

  for (let i = 1; i <= 1000; i++) {
    try {
      // Update progress (0-100%)
      const currentProgress = Math.min((i / 1000) * 100, 100);
      setProgress(videoId, currentProgress);

      const url = `https://d13z5uuzt1wkbz.cloudfront.net/${videoId}/HIDDEN${quality}-${String(
        i
      ).padStart(5, "0")}.ts`;

      const resp = await fetch(url, { method: "HEAD" });

      if (resp.status === 403) {
        break;
      } else if (resp.ok) {
        last = i;
      } else {
        console.error(`Failed to fetch part ${i}: ${resp.status}`);
      }
    } catch (error) {
      console.error(`Error checking part ${i}:`, error);
      continue;
    }
  }

  if (last === 0) {
    throw new Error("No valid video parts found");
  }

  return last;
}

export async function POST(req: Request) {
  try {
    const { videoId, quality } = await req.json();

    if (!videoId || !quality) {
      return NextResponse.json(
        { error: "Missing videoId or quality" },
        { status: 400 }
      );
    }

    try {
      // Clear any existing progress
      clearProgress(videoId);

      const lastPart = await findLastPart(videoId, quality);

      // Generate M3U8 playlist
      let m3u8Content =
        "#EXTM3U\n#EXT-X-PLAYLIST-TYPE:VOD\n#EXT-X-TARGETDURATION:10\n";

      for (let i = 1; i <= lastPart; i++) {
        m3u8Content += `#EXTINF:10.0,\nhttps://d13z5uuzt1wkbz.cloudfront.net/${videoId}/HIDDEN${quality}-${String(
          i
        ).padStart(5, "0")}.ts\n`;
      }

      m3u8Content += "#EXT-X-ENDLIST";

      // Clear progress after completion
      clearProgress(videoId);

      return new NextResponse(m3u8Content, {
        headers: {
          "Content-Type": "application/vnd.apple.mpegurl",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (error) {
      clearProgress(videoId);
      console.error("Error processing video:", error);
      throw error;
    }
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      {
        error: "Failed to process video",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
