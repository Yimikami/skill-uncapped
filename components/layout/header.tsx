"use client";

import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { ThemeToggle } from "@/components/theme-toggle";
import { useEffect, useState } from "react";
import { Github } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center">
                <Image
                  src="/logo.png"
                  alt="SkillUncapped Logo"
                  width={180}
                  height={40}
                  priority
                />
              </Link>
              <nav className="hidden md:flex space-x-4">
                <Link href="/browse">
                  <Button variant="ghost" className="text-sm font-medium">
                    Browse
                  </Button>
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="https://github.com/Yimikami/skill-uncapped"
                target="_blank"
              >
                <Button variant="ghost" size="icon">
                  <Github className="h-5 w-5" />
                  <span className="sr-only">GitHub</span>
                </Button>
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center">
              <Image
                src={theme === "dark" ? "/logo-white.png" : "/logo.png"}
                alt="SkillUncapped Logo"
                width={180}
                height={40}
                priority
              />
            </Link>
            <nav className="hidden md:flex space-x-4">
              <Link href="/browse">
                <Button variant="ghost" className="text-sm font-medium">
                  Browse
                </Button>
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="https://github.com/Yimikami/skill-uncapped"
              target="_blank"
            >
              <Button variant="ghost" size="icon">
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </Button>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
