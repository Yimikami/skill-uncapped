import { NextResponse } from "next/server";
import { setProgress, clearProgress } from "../progress/route";

async function downloadPart(
  videoId: string,
  quality: string,
  partNumber: number
): Promise<Buffer> {
  const url = `https://d13z5uuzt1wkbz.cloudfront.net/${videoId}/HIDDEN${quality}-${String(
    partNumber
  ).padStart(5, "0")}.ts`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download part ${partNumber}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
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
      clearProgress(videoId);

      // First, find the last part using HEAD requests
      let lastPart = 0;
      for (let i = 1; i <= 1000; i++) {
        const url = `https://d13z5uuzt1wkbz.cloudfront.net/${videoId}/HIDDEN${quality}-${String(
          i
        ).padStart(5, "0")}.ts`;

        try {
          const resp = await fetch(url, { method: "HEAD" });
          if (resp.status === 403) break;
          if (resp.ok) lastPart = i;
        } catch (error) {
          console.error(`Error checking part ${i}:`, error);
          continue;
        }
      }

      if (lastPart === 0) {
        throw new Error("No valid video parts found");
      }

      // Create a TransformStream to stream the response
      const stream = new TransformStream();
      const writer = stream.writable.getWriter();

      // Start downloading parts in the background
      (async () => {
        try {
          for (let i = 1; i <= lastPart; i++) {
            // Update progress
            const progress = Math.round((i / lastPart) * 100);
            setProgress(videoId, progress);

            // Download and write part
            const partData = await downloadPart(videoId, quality, i);
            await writer.write(partData);
          }
        } catch (error) {
          console.error("Download error:", error);
        } finally {
          clearProgress(videoId);
          await writer.close();
        }
      })();

      // Return the stream as the response
      return new Response(stream.readable, {
        headers: {
          "Content-Type": "video/MP2T",
          "Content-Disposition": `attachment; filename="${videoId}-${quality}.ts"`,
        },
      });
    } catch (error) {
      clearProgress(videoId);
      throw error;
    }
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      {
        error: "Failed to download video",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
