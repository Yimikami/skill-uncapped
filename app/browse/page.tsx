"use client";

import { useState, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { VideoIcon, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import Hls from "hls.js";

const videos = [
  {
    id: "example1",
    title: "Advanced Positioning Guide",
    thumbnail: "https://i.ytimg.com/vi/placeholder1/maxresdefault.jpg",
  },
  {
    id: "example2",
    title: "Map Awareness Masterclass",
    thumbnail: "https://i.ytimg.com/vi/placeholder2/maxresdefault.jpg",
  },
];

export default function BrowsePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [quality, setQuality] = useState("1500");
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [isDownloading, setIsDownloading] = useState<Record<string, boolean>>({});
  const [progress, setProgress] = useState<Record<string, number>>({});
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const hlsRefs = useRef<Record<string, Hls | null>>({});
  const progressIntervalRefs = useRef<Record<string, number | null>>({});
  const { toast } = useToast();

  const filteredVideos = videos.filter((video) =>
    video.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pollProgress = useCallback(async (videoId: string) => {
    try {
      const response = await fetch(`/api/progress?id=${videoId}`);
      if (response.ok) {
        const data = await response.json();
        setProgress((prev) => ({ ...prev, [videoId]: data.progress }));
      }
    } catch (error) {
      console.error("Error polling progress:", error);
    }
  }, []);

  const startProgressPolling = useCallback(
    (videoId: string) => {
      if (progressIntervalRefs.current[videoId] !== null) {
        window.clearInterval(progressIntervalRefs.current[videoId]!);
      }
      progressIntervalRefs.current[videoId] = window.setInterval(
        () => pollProgress(videoId),
        500
      );
    },
    [pollProgress]
  );

  const stopProgressPolling = useCallback((videoId: string) => {
    if (progressIntervalRefs.current[videoId] !== null) {
      window.clearInterval(progressIntervalRefs.current[videoId]!);
      progressIntervalRefs.current[videoId] = null;
    }
  }, []);

  const handleStream = async (videoId: string) => {
    setIsLoading((prev) => ({ ...prev, [videoId]: true }));
    setProgress((prev) => ({ ...prev, [videoId]: 0 }));

    try {
      startProgressPolling(videoId);

      if (Hls.isSupported() && videoRefs.current[videoId]) {
        if (hlsRefs.current[videoId]) {
          hlsRefs.current[videoId]!.destroy();
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

        hlsRefs.current[videoId] = hls;
        hls.attachMedia(videoRefs.current[videoId]!);
        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
          hls.loadSource(url);
          videoRefs.current[videoId]?.play();
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            toast({
              title: "Streaming Error",
              description: "Failed to load video. Please try again.",
              variant: "destructive",
            });
          }
        });

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          stopProgressPolling(videoId);
        });
      } else {
        toast({
          title: "Browser Not Supported",
          description: "Please use a modern browser that supports HLS.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to stream video",
        variant: "destructive",
      });
    } finally {
      setIsLoading((prev) => ({ ...prev, [videoId]: false }));
      stopProgressPolling(videoId);
      setProgress((prev) => ({ ...prev, [videoId]: 0 }));
    }
  };

  const handleDownload = async (videoId: string) => {
    setIsDownloading((prev) => ({ ...prev, [videoId]: true }));
    setProgress((prev) => ({ ...prev, [videoId]: 0 }));

    try {
      startProgressPolling(videoId);

      const response = await fetch("/api/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ videoId, quality }),
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
      toast({
        title: "Download Error",
        description:
          error instanceof Error ? error.message : "Failed to download video",
        variant: "destructive",
      });
    } finally {
      setIsDownloading((prev) => ({ ...prev, [videoId]: false }));
      stopProgressPolling(videoId);
      setProgress((prev) => ({ ...prev, [videoId]: 0 }));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <Input
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
            <Select value={quality} onValueChange={setQuality}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select quality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="720">720p</SelectItem>
                <SelectItem value="1500">1080p</SelectItem>
                <SelectItem value="2500">1440p</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredVideos.map((video) => (
              <Card key={video.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full aspect-video object-cover"
                  />
                  <div className="p-4 space-y-4">
                    <h3 className="font-semibold text-lg">{video.title}</h3>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        className="flex-1 gap-2"
                        onClick={() => handleStream(video.id)}
                        disabled={isLoading[video.id]}
                      >
                        <VideoIcon className="h-4 w-4" />
                        {isLoading[video.id] ? "Loading..." : "Stream"}
                      </Button>
                      <Button
                        className="flex-1 gap-2"
                        onClick={() => handleDownload(video.id)}
                        disabled={isDownloading[video.id]}
                        variant="outline"
                      >
                        <Download className="h-4 w-4" />
                        {isDownloading[video.id] ? "Downloading..." : "Download"}
                      </Button>
                    </div>
                    {(isLoading[video.id] || isDownloading[video.id]) && (
                      <Progress value={progress[video.id] || 0} className="w-full" />
                    )}
                    {videoRefs.current[video.id] && (
                      <div className="aspect-video w-full bg-muted rounded-lg overflow-hidden">
                        <video
                          ref={(el) => {
                            videoRefs.current[video.id] = el;
                          }}
                          controls
                          className="w-full h-full"
                          playsInline
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}