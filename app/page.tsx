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
import { useState, useRef, useCallback, useEffect } from "react";
import Hls from "hls.js";
import { Card, CardContent } from "@/components/ui/card";
import { VideoIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

export default function Home() {
  const [videoUrl, setVideoUrl] = useState("");
  const [quality, setQuality] = useState("1500");
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const { toast } = useToast();

  const pollProgress = useCallback(async (videoId: string) => {
    try {
      const response = await fetch(`/api/progress?id=${videoId}`);
      if (response.ok) {
        const data = await response.json();
        setProgress(data.progress);
      }
    } catch (error) {
      console.error("Error polling progress:", error);
    }
  }, []);

  const startProgressPolling = useCallback(
    (videoId: string) => {
      // Clear any existing interval
      if (progressIntervalRef.current !== null) {
        window.clearInterval(progressIntervalRef.current);
      }
      // Poll every 500ms
      progressIntervalRef.current = window.setInterval(
        () => pollProgress(videoId),
        500
      );
    },
    [pollProgress]
  );

  const stopProgressPolling = useCallback(() => {
    if (progressIntervalRef.current !== null) {
      window.clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  const handleStream = async () => {
    if (!videoUrl) return;
    setIsLoading(true);
    setProgress(0);

    try {
      const match = videoUrl.match(/([a-z0-9]{10})(?:\/|$)/);
      if (!match) {
        throw new Error("Invalid video URL");
      }

      const videoId = match[1];
      startProgressPolling(videoId);

      if (Hls.isSupported() && videoRef.current) {
        if (hlsRef.current) {
          hlsRef.current.destroy();
        }

        const response = await fetch("/api/stream", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ videoId, quality }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.details || "Failed to fetch video data");
        }

        const m3u8Content = await response.text();
        const blob = new Blob([m3u8Content], { type: "application/x-mpegURL" });
        const url = URL.createObjectURL(blob);

        const hls = new Hls({
          maxBufferSize: 0,
          maxBufferLength: 30,
          startPosition: 0,
          debug: true,
        });

        hlsRef.current = hls;
        hls.attachMedia(videoRef.current);
        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
          hls.loadSource(url);
          videoRef.current?.play();
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          console.error("HLS Error:", data);
          if (data.fatal) {
            toast({
              title: "Streaming Error",
              description: "Failed to load video. Please try again.",
              variant: "destructive",
            });
          }
        });

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log("HLS Manifest parsed");
          stopProgressPolling();
        });

        hls.on(Hls.Events.LEVEL_LOADED, () => {
          console.log("HLS Level loaded");
        });
      } else {
        toast({
          title: "Browser Not Supported",
          description: "Please use a modern browser that supports HLS.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Streaming error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to stream video",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      stopProgressPolling();
      setProgress(0);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopProgressPolling();
    };
  }, [stopProgressPolling]);

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

                {isLoading && progress > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Processing video...</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}

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
