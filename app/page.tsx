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
import { VideoIcon, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

export default function Home() {
  const [videoUrl, setVideoUrl] = useState("");
  const [videoId, setVideoId] = useState("");
  const [quality, setQuality] = useState("1500");
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
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

  // Helper function to extract video ID
  const extractVideoId = useCallback((url: string): string => {
    // Clean the URL first (remove any leading/trailing spaces and @)
    const cleanUrl = url.trim().replace(/^@/, "");

    const patterns = [
      /(?:\/|^)([a-z0-9]{10})(?:\/|$)/, // Original pattern
      /\/browse\/video\/([a-z0-9]{10})(?:\/|$)/, // browse/video format
      /\/commentaries\/([a-z0-9]{8,12})(?:\/|$)/, // commentaries format with length validation
    ];

    for (const pattern of patterns) {
      const match = cleanUrl.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    // If no pattern matches, check if the input itself is a valid ID
    if (/^[a-z0-9]{8,12}$/.test(cleanUrl)) {
      return cleanUrl;
    }

    return url; // Return original if no valid pattern or ID found
  }, []);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setVideoUrl(url);

    const videoId = extractVideoId(url);
    if (videoId !== url) {
      // Only update if a pattern matched
      setVideoId(videoId);
      setVideoUrl(videoId);
    }
  };

  const handleStream = async () => {
    if (!videoUrl) return;
    setIsLoading(true);
    setProgress(0);

    try {
      const videoIdToUse = extractVideoId(videoUrl);
      startProgressPolling(videoIdToUse);

      if (Hls.isSupported() && videoRef.current) {
        if (hlsRef.current) {
          hlsRef.current.destroy();
        }

        const response = await fetch("/api/stream", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ videoId: videoIdToUse, quality }),
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

  const handleDownload = async () => {
    if (!videoUrl) return;
    setIsDownloading(true);
    setProgress(0);

    try {
      const videoIdToUse = extractVideoId(videoUrl);
      startProgressPolling(videoIdToUse);

      const response = await fetch("/api/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ videoId: videoIdToUse, quality }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || "Failed to download video");
      }

      // Create a download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `video-${quality}.ts`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Download Complete",
        description: "Your video has been downloaded successfully.",
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download Error",
        description:
          error instanceof Error ? error.message : "Failed to download video",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
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
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 lg:py-16">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="space-y-4">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center">
              SkillUncapped Video Player
            </h1>
            <p className="text-muted-foreground text-center text-sm md:text-base">
              Enter a Skill-Capped video URL or ID to start streaming
            </p>
          </div>

          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <Input
                  placeholder="Enter video URL or ID"
                  value={videoUrl}
                  onChange={handleUrlChange}
                  className="flex-1"
                />
                <Select value={quality} onValueChange={setQuality}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Select quality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="720">720p</SelectItem>
                    <SelectItem value="1500">1080p</SelectItem>
                    <SelectItem value="2500">1440p</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  className="flex-1 gap-2"
                  onClick={handleStream}
                  disabled={!videoUrl || isLoading}
                >
                  <VideoIcon className="h-4 w-4" />
                  {isLoading ? "Loading..." : "Stream"}
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={handleDownload}
                  disabled={!videoUrl || isDownloading}
                  variant="outline"
                >
                  <Download className="h-4 w-4" />
                  {isDownloading ? "Downloading..." : "Download"}
                </Button>
              </div>

              {(isLoading || isDownloading) && (
                <Progress value={progress} className="w-full" />
              )}
            </CardContent>
          </Card>

          {videoRef && (
            <div className="aspect-video w-full bg-muted rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                controls
                className="w-full h-full"
                playsInline
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
