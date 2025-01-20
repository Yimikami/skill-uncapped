"use client";

import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useRef } from "react";
import Hls from "hls.js";
import { Card, CardContent } from "@/components/ui/card";
import { VideoIcon } from "lucide-react";

export default function Home() {
  const [videoUrl, setVideoUrl] = useState("");
  const [quality, setQuality] = useState("1500");
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const handleStream = async () => {
    if (!videoUrl) return;
    setIsLoading(true);

    try {
      // Extract video ID from URL
      const match = videoUrl.match(/([a-z0-9]{10})(?:\/|$)/);
      if (!match) {
        throw new Error("Invalid video URL");
      }

      const videoId = match[1];

      if (Hls.isSupported() && videoRef.current) {
        if (hlsRef.current) {
          hlsRef.current.destroy();
        }

        const hls = new Hls({
          maxBufferSize: 0,
          maxBufferLength: 30,
          startPosition: 0,
        });

        hlsRef.current = hls;
        hls.attachMedia(videoRef.current);
        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
          console.log("HLS Media attached");
        });
      }
    } catch (error) {
      console.error("Streaming error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto space-y-10">
            <div className="space-y-4 text-center">
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Welcome to SkillUncapped
              </h1>
              <p className="text-muted-foreground text-lg">
                Enhance your gaming skills with high-quality educational content
              </p>
            </div>

            <Card className="border-2 border-muted">
              <CardContent className="space-y-6 pt-6">
                <div className="flex gap-3">
                  <div className="flex-1 flex gap-3">
                    <Input
                      type="url"
                      placeholder="Enter video URL..."
                      value={videoUrl}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setVideoUrl(e.target.value)
                      }
                      className="flex-1 h-11"
                    />
                    <Select value={quality} onValueChange={setQuality}>
                      <SelectTrigger className="w-[120px] h-11 shrink-0">
                        <SelectValue placeholder="Quality" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1500">720p</SelectItem>
                        <SelectItem value="2500">1080p</SelectItem>
                        <SelectItem value="4500">4K</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleStream}
                    disabled={!videoUrl || isLoading}
                    size="lg"
                    className="px-8 transition-all hover:scale-105 shrink-0"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Loading...
                      </div>
                    ) : (
                      "Stream"
                    )}
                  </Button>
                </div>

                <div className="aspect-video bg-muted rounded-lg overflow-hidden relative group">
                  {!videoRef.current?.src && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-muted-foreground flex flex-col items-center gap-2">
                        <VideoIcon className="w-10 h-10" />
                        <p>Enter a URL to start streaming</p>
                      </div>
                    </div>
                  )}
                  <video
                    ref={videoRef}
                    className="w-full h-full"
                    controls
                    autoPlay
                    playsInline
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
