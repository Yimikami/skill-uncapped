"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import {
  VideoIcon,
  Download,
  ChevronLeft,
  ChevronRight,
  Gamepad2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import Hls from "hls.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Video {
  role: string;
  title: string;
  desc: string;
  rDate: number;
  durSec: number;
  uuid: string;
  tId: number;
  tSS: string;
  cSS: string;
}

interface Commentary {
  role: string;
  rDate: number;
  durSec: number;
  uuid: string;
  tId: number;
  tSS: string;
  staff: string;
  matchLink?: string;
  yourChampion?: string;
  theirChampion?: string;
  k?: number;
  d?: number;
  a?: number;
  gameTime?: string;
  carry?: string;
  type?: string;
}

interface Chapter {
  title: string;
  vids: { uuid: string }[];
}

interface CourseContent {
  chapters: Chapter[];
}

interface Course {
  title: string;
  uuid: string;
  desc: string;
  rDate: number;
  role: string;
  courseImage?: string;
  courseImage2?: string;
  courseImage3?: string;
  tags: string[];
  recommended?: boolean;
  override?: boolean;
  overlay?: string;
  chapters?: Chapter[];
  videos?: Video[];
}

interface CourseData {
  courses: Course[];
  videos: Video[];
  commentaries: Commentary[];
  videosToCourses: Record<string, CourseContent>;
}

const COURSE_URLS = {
  valorant:
    "https://d20k8dfo6rtj2t.cloudfront.net/courses_v2/valorant/course_dump_1733423887447.json",
  lol: "https://d20k8dfo6rtj2t.cloudfront.net/courses_v2/lol/course_dump_1737851539960.json",
};

const getThumbnailUrl = (uuid: string) => {
  return `https://ik.imagekit.io/skillcapped/thumbnails/${uuid}/thumbnails/thumbnail_39.jpg?tr=w-1440,h-810,cm-extract,bl-1:w-600`;
};

export default function BrowsePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [quality, setQuality] = useState("1500");
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [isDownloading, setIsDownloading] = useState<Record<string, boolean>>(
    {}
  );
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [courseData, setCourseData] = useState<CourseData>({
    courses: [],
    videos: [],
    commentaries: [],
    videosToCourses: {},
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("courses");
  const [isFetchingCourses, setIsFetchingCourses] = useState(true);
  const [selectedGame, setSelectedGame] = useState<"lol" | "valorant">("lol");
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const hlsRefs = useRef<Record<string, Hls | null>>({});
  const progressIntervalRefs = useRef<Record<string, number | null>>({});
  const { toast } = useToast();
  const [champions, setChampions] = useState<{ name: string }[]>([]);
  const [yourChampionFilter, setYourChampionFilter] = useState("ANY");
  const [theirChampionFilter, setTheirChampionFilter] = useState("ANY");

  const ITEMS_PER_PAGE = 12;

  const fetchCourses = useCallback(
    async (game: "lol" | "valorant") => {
      try {
        setIsFetchingCourses(true);
        const response = await fetch(`/api/courses?game=${game}`);
        if (!response.ok) {
          throw new Error("Failed to fetch courses");
        }
        const data: CourseData = await response.json();
        setCourseData(data);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch courses. Please try again later.",
          variant: "destructive",
        });
        setCourseData({
          courses: [],
          videos: [],
          commentaries: [],
          videosToCourses: {},
        });
      } finally {
        setIsFetchingCourses(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    fetchCourses(selectedGame);
  }, [fetchCourses, selectedGame]);

  useEffect(() => {
    const fetchChampions = async () => {
      try {
        const response = await fetch("/api/champions");
        if (response.ok) {
          const data = await response.json();
          setChampions(data);
        }
      } catch (error) {
        console.error("Failed to fetch champions:", error);
      }
    };

    fetchChampions();
  }, []);

  const filteredContent = {
    courses: courseData.courses.filter((course) =>
      course.title.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    videos: courseData.videos.filter((video) =>
      video.title.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    commentaries: courseData.commentaries.filter(
      (commentary) =>
        commentary.staff.toLowerCase().includes(searchQuery.toLowerCase()) &&
        (yourChampionFilter === "ANY" ||
          commentary.yourChampion?.toLowerCase() ===
            yourChampionFilter.toLowerCase()) &&
        (theirChampionFilter === "ANY" ||
          commentary.theirChampion?.toLowerCase() ===
            theirChampionFilter.toLowerCase())
    ),
  };

  const totalPages = Math.ceil(
    filteredContent[activeTab as keyof typeof filteredContent].length /
      ITEMS_PER_PAGE
  );

  const paginatedContent = filteredContent[
    activeTab as keyof typeof filteredContent
  ].slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

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

  const renderVideoCard = (video: Video) => (
    <Card key={video.uuid} className="overflow-hidden">
      <CardContent className="p-0">
        <img
          src={getThumbnailUrl(video.uuid)}
          alt={video.title}
          className="w-full aspect-video object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = `https://placehold.co/600x400?text=${encodeURIComponent(video.title)}`;
          }}
        />
        <div className="p-4 space-y-4">
          <h3 className="font-semibold text-lg">{video.title}</h3>
          {video.desc && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {video.desc}
            </p>
          )}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Role: {video.role}</span>
            <span>Duration: {Math.floor(video.durSec / 60)}min</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              className="flex-1 gap-2"
              onClick={() => handleStream(video.uuid)}
              disabled={isLoading[video.uuid]}
            >
              <VideoIcon className="h-4 w-4" />
              {isLoading[video.uuid] ? "Loading..." : "Stream"}
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={() => handleDownload(video.uuid)}
              disabled={isDownloading[video.uuid]}
              variant="outline"
            >
              <Download className="h-4 w-4" />
              {isDownloading[video.uuid] ? "Downloading..." : "Download"}
            </Button>
          </div>
          {(isLoading[video.uuid] || isDownloading[video.uuid]) && (
            <Progress value={progress[video.uuid] || 0} className="w-full" />
          )}
          {videoRefs.current[video.uuid] && (
            <div className="aspect-video w-full bg-muted rounded-lg overflow-hidden">
              <video
                ref={(el) => {
                  videoRefs.current[video.uuid] = el;
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
  );

  const renderCommentaryCard = (commentary: Commentary) => (
    <Card key={commentary.uuid} className="overflow-hidden">
      <CardContent className="p-0">
        <img
          src={getThumbnailUrl(commentary.uuid)}
          alt={`Commentary by ${commentary.staff}`}
          className="w-full aspect-video object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = `https://placehold.co/600x400?text=${encodeURIComponent(`Commentary by ${commentary.staff}`)}`;
          }}
        />
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">
              {commentary.yourChampion &&
                commentary.yourChampion + " vs " + commentary.theirChampion}
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {commentary.gameTime && (
                <div>
                  <span className="text-muted-foreground">Duration: </span>
                  {commentary.gameTime}
                </div>
              )}
              {commentary.k !== undefined && (
                <div>
                  <span className="text-muted-foreground">KDA: </span>
                  {commentary.k}/{commentary.d}/{commentary.a}
                </div>
              )}
            </div>
            {commentary.matchLink && (
              <a
                href={commentary.matchLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:underline"
              >
                View Match Details
              </a>
            )}
          </div>
          <div className="flex flex-col sm:flex-row justify-between gap-2">
            <Button
              className="flex-1 gap-2"
              onClick={() => handleStream(commentary.uuid)}
              disabled={isLoading[commentary.uuid]}
            >
              <VideoIcon className="h-4 w-4" />
              {isLoading[commentary.uuid] ? "Loading..." : "Stream"}
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={() => handleDownload(commentary.uuid)}
              disabled={isDownloading[commentary.uuid]}
              variant="outline"
            >
              <Download className="h-4 w-4" />
              {isDownloading[commentary.uuid] ? "Downloading..." : "Download"}
            </Button>
          </div>
          {(isLoading[commentary.uuid] || isDownloading[commentary.uuid]) && (
            <Progress
              value={progress[commentary.uuid] || 0}
              className="w-full"
            />
          )}
          {videoRefs.current[commentary.uuid] && (
            <div className="aspect-video w-full bg-muted rounded-lg overflow-hidden">
              <video
                ref={(el) => {
                  videoRefs.current[commentary.uuid] = el;
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
  );

  const isCourse = (item: Video | Commentary | Course): item is Course => {
    return "courseImage" in item && "tags" in item;
  };

  const isVideo = (item: Video | Commentary | Course): item is Video => {
    return "durSec" in item && !("staff" in item);
  };

  const isCommentary = (
    item: Video | Commentary | Course
  ): item is Commentary => {
    return "staff" in item;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-4 flex-1">
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-md"
              />
              <Select
                value={selectedGame}
                onValueChange={(value: "lol" | "valorant") =>
                  setSelectedGame(value)
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select game" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lol">League of Legends</SelectItem>
                  <SelectItem value="valorant">Valorant</SelectItem>
                </SelectContent>
              </Select>
              {activeTab === "commentaries" && selectedGame === "lol" && (
                <>
                  <Select
                    value={yourChampionFilter}
                    onValueChange={setYourChampionFilter}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Your Champion" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ANY">Any Champion</SelectItem>
                      {champions.map((champion) => (
                        <SelectItem
                          key={champion.name}
                          value={champion.name.toLowerCase()}
                        >
                          {champion.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={theirChampionFilter}
                    onValueChange={setTheirChampionFilter}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Enemy Champion" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ANY">Any Champion</SelectItem>
                      {champions.map((champion) => (
                        <SelectItem
                          key={champion.name}
                          value={champion.name.toLowerCase()}
                        >
                          {champion.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>
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

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList
              className={
                selectedGame === "lol"
                  ? "grid w-full grid-cols-3"
                  : "grid w-full grid-cols-2"
              }
            >
              <TabsTrigger value="courses">
                Courses ({filteredContent.courses.length})
              </TabsTrigger>
              <TabsTrigger value="videos">
                Videos ({filteredContent.videos.length})
              </TabsTrigger>
              {selectedGame === "lol" && (
                <TabsTrigger value="commentaries">
                  Commentaries ({filteredContent.commentaries.length})
                </TabsTrigger>
              )}
            </TabsList>

            {isFetchingCourses ? (
              <div className="text-center py-8">Loading content...</div>
            ) : (
              <>
                <TabsContent value="courses">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {(paginatedContent as Course[]).map((course) => (
                      <Card key={course.uuid} className="overflow-hidden">
                        <CardContent className="p-0">
                          <img
                            src={
                              course.courseImage3 ||
                              `https://placehold.co/600x400?text=${encodeURIComponent(
                                course.title
                              )}`
                            }
                            alt={course.title}
                            className="w-full aspect-video object-cover"
                          />
                          <div className="p-4 space-y-4">
                            <h3 className="font-semibold text-lg">
                              {course.title}
                            </h3>
                            {course.desc && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {course.desc}
                              </p>
                            )}
                            {course.tags && (
                              <div className="flex flex-wrap gap-2">
                                {course.tags.map((tag: string) => (
                                  <span
                                    key={tag}
                                    className="text-xs bg-muted px-2 py-1 rounded-full"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                            {course.chapters && (
                              <div className="space-y-2">
                                {course.chapters.map((chapter, index) => (
                                  <div key={index} className="space-y-1">
                                    <h4 className="font-medium text-sm">
                                      {chapter.title}
                                    </h4>
                                    <p className="text-xs text-muted-foreground">
                                      {chapter.vids.length} videos
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="flex flex-col sm:flex-row gap-2">
                              <Button
                                className="flex-1 gap-2"
                                onClick={() => handleStream(course.uuid)}
                                disabled={isLoading[course.uuid]}
                              >
                                <VideoIcon className="h-4 w-4" />
                                {isLoading[course.uuid]
                                  ? "Loading..."
                                  : "Stream"}
                              </Button>
                              <Button
                                className="flex-1 gap-2"
                                onClick={() => handleDownload(course.uuid)}
                                disabled={isDownloading[course.uuid]}
                                variant="outline"
                              >
                                <Download className="h-4 w-4" />
                                {isDownloading[course.uuid]
                                  ? "Downloading..."
                                  : "Download"}
                              </Button>
                            </div>
                            {(isLoading[course.uuid] ||
                              isDownloading[course.uuid]) && (
                              <Progress
                                value={progress[course.uuid] || 0}
                                className="w-full"
                              />
                            )}
                            {videoRefs.current[course.uuid] && (
                              <div className="aspect-video w-full bg-muted rounded-lg overflow-hidden">
                                <video
                                  ref={(el) => {
                                    videoRefs.current[course.uuid] = el;
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
                </TabsContent>

                <TabsContent value="videos">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {(paginatedContent as Video[]).map((video) =>
                      renderVideoCard(video)
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="commentaries">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {(paginatedContent as Commentary[]).map((commentary) =>
                      renderCommentaryCard(commentary)
                    )}
                  </div>
                </TabsContent>

                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-4 mt-8">
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </Tabs>
        </div>
      </main>
    </div>
  );
}
