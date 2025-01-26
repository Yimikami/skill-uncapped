import { NextResponse } from "next/server";

interface Video {
  uuid: string;
  courseName?: string;
}

interface Chapter {
  vids: { uuid: string }[];
  chapters: Chapter[];
}

interface CourseContent {
  chapters: Chapter[];
}

interface Course {
  title: string;
}

interface CourseData {
  courses: Course[];
  videos: Video[];
  videosToCourses: Record<string, CourseContent>;
}

const COURSE_URLS = {
  valorant:
    "https://d20k8dfo6rtj2t.cloudfront.net/courses_v2/valorant/course_dump_1733423887447.json",
  lol: "https://d20k8dfo6rtj2t.cloudfront.net/courses_v2/lol/course_dump_1737851539960.json",
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const game = searchParams.get("game") as "valorant" | "lol";

  if (!game || !COURSE_URLS[game]) {
    return NextResponse.json({ error: "Invalid game type" }, { status: 400 });
  }

  try {
    const response = await fetch(COURSE_URLS[game]);
    if (!response.ok) {
      throw new Error("Failed to fetch courses");
    }
    const data = (await response.json()) as CourseData;

    // Create a map of video UUIDs to course names
    const videoToCourseMap = new Map<string, string>();
    Object.entries(data.videosToCourses).forEach(([courseTitle, content]) => {
      content.chapters.forEach((chapter) => {
        chapter.vids.forEach((vid) => {
          videoToCourseMap.set(vid.uuid, courseTitle);
        });
      });
    });

    // Add course names to videos
    const videosWithCourses = data.videos.map((video) => ({
      ...video,
      courseName: videoToCourseMap.get(video.uuid),
    }));

    // Process courses to include their videos
    const processedCourses = data.courses.map((course) => {
      const courseVideos: Video[] = [];
      const courseContent = Object.entries(data.videosToCourses).find(
        ([title]) => title.includes(course.title)
      );

      if (courseContent) {
        courseContent[1].chapters.forEach((chapter) => {
          chapter.vids.forEach((vid) => {
            const video = videosWithCourses.find((v) => v.uuid === vid.uuid);
            if (video) {
              courseVideos.push(video);
            }
          });
        });
      }

      return {
        ...course,
        videos: courseVideos,
        chapters: courseContent?.[1].chapters,
      };
    });

    return NextResponse.json({
      ...data,
      courses: processedCourses,
      videos: videosWithCourses,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}
