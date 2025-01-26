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
import { VideoIcon, Download, PlayCircle, Link2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";

export default function StreamPage() {
  const [videoUrl, setVideoUrl] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      if (progressIntervalRef.current !== null) {
        window.clearInterval(progressIntervalRef.current);
      }
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

  const extractVideoId = useCallback((url: string): string => {
    const cleanUrl = url.trim().replace(/^@/, "");

    const patterns = [
      /(?:\/|^)([a-z0-9]{10})(?:\/|$)/,
      /\/browse\/video\/([a-z0-9]{10})(?:\/|$)/,
      /\/commentaries\/([a-z0-9]{8,12})(?:\/|$)/,
    ];

    for (const pattern of patterns) {
      const match = cleanUrl.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    if (/^[a-z0-9]{8,12}$/.test(cleanUrl)) {
      return cleanUrl;
    }

    return url;
  }, []);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setVideoUrl(url);

    const videoId = extractVideoId(url);
    if (videoId !== url) {
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

  useEffect(() => {
    return () => {
      stopProgressPolling();
    };
  }, [stopProgressPolling]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto space-y-8"
        >
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <PlayCircle className="h-4 w-4" />
              <span>Video Player</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Stream or Download Videos
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Enter a video URL or ID to start streaming or downloading content
              in your preferred quality
            </p>
          </div>

          <Card className="overflow-hidden border-2">
            <CardContent className="p-8 space-y-8">
              {/* Input Section */}
              <div className="grid gap-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 space-y-2">
                    <label htmlFor="video-url" className="text-sm font-medium">
                      Video URL or ID
                    </label>
                    <div className="relative">
                      <Input
                        id="video-url"
                        placeholder="Enter video URL or ID"
                        value={videoUrl}
                        onChange={handleUrlChange}
                        className="pr-10"
                      />
                      <Link2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="w-full md:w-[180px] space-y-2">
                    <label htmlFor="quality" className="text-sm font-medium">
                      Quality
                    </label>
                    <Select value={quality} onValueChange={setQuality}>
                      <SelectTrigger id="quality">
                        <SelectValue placeholder="Select quality" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="720">720p</SelectItem>
                        <SelectItem value="1500">1080p</SelectItem>
                        <SelectItem value="2500">1440p</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    className="flex-1 gap-2 h-14 text-xl"
                    onClick={handleStream}
                    disabled={!videoUrl || isLoading}
                  >
                    <VideoIcon className="h-8 w-8" />
                    {isLoading ? "Loading..." : "Stream Now"}
                  </Button>
                  <Button
                    className="flex-1 gap-2 h-14 text-xl"
                    onClick={handleDownload}
                    disabled={!videoUrl || isDownloading}
                    variant="outline"
                  >
                    <Download className="h-8 w-8" />
                    {isDownloading ? "Downloading..." : "Download"}
                  </Button>
                </div>
              </div>

              {/* Progress Bar */}
              {(isLoading || isDownloading) && (
                <div className="space-y-2">
                  <Progress value={progress} className="h-2" />
                  <p className="text-sm text-center text-muted-foreground">
                    {isLoading ? "Preparing stream" : "Downloading video"} (
                    {Math.round(progress)}%)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Video Player */}
          {videoRef && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="aspect-video w-full bg-muted rounded-lg overflow-hidden shadow-lg"
            >
              <video
                ref={videoRef}
                controls
                className="w-full h-full"
                playsInline
              />
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
