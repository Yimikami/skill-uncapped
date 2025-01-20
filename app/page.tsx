"use client";

import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function Home() {
  const [videoUrl, setVideoUrl] = useState("");

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="space-y-2 text-center">
              <h1 className="text-4xl font-bold tracking-tight">
                Welcome to SkillUncapped
              </h1>
              <p className="text-muted-foreground">
                Enter a video URL to start streaming
              </p>
            </div>

            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="Enter video URL..."
                value={videoUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setVideoUrl(e.target.value)
                }
                className="flex-1"
              />
              <Button type="submit">Stream</Button>
            </div>

            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">
                Video player will appear here
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
