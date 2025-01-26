"use client";

import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { ThemeToggle } from "@/components/theme-toggle";
import { useEffect, useState } from "react";
import { Github, VideoIcon, BookOpen, Home, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";

export function Header() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  const navigation = [
    { name: "Home", href: "/", icon: Home },
    { name: "Browse", href: "/browse", icon: BookOpen },
    { name: "Stream", href: "/stream", icon: VideoIcon },
  ];

  // Always render the light theme logo initially to match SSR
  const logoSrc = mounted && theme === "dark" ? "/logo-white.png" : "/logo.png";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="flex items-center transition-transform hover:scale-105"
            >
              <Image
                src={logoSrc}
                alt="SkillUncapped Logo"
                width={180}
                height={40}
                priority
                className="h-6 w-auto sm:h-8"
              />
            </Link>
            <nav className="hidden md:flex items-center space-x-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Button
                    key={item.name}
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    asChild
                  >
                    <Link href={item.href} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  </Button>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" asChild>
              <Link
                href="https://github.com/Yimikami/skill-uncapped"
                target="_blank"
              >
                <Github className="h-5 w-5" />
              </Link>
            </Button>

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <SheetTitle className="text-left">Navigation Menu</SheetTitle>
                <nav className="flex flex-col gap-2 mt-8">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Button
                        key={item.name}
                        variant={isActive ? "secondary" : "ghost"}
                        size="sm"
                        asChild
                        className="justify-start"
                      >
                        <Link
                          href={item.href}
                          className="flex items-center gap-2"
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </Link>
                      </Button>
                    );
                  })}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
