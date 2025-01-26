"use client";

import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import {
  Gamepad2,
  ArrowRight,
  VideoIcon,
  Trophy,
  Zap,
  MonitorPlay,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <div className="relative overflow-hidden border-b bg-muted/40">
          <div className="container mx-auto px-4">
            <div className="py-20 md:py-32 relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center space-y-6 max-w-3xl mx-auto"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  <Gamepad2 className="h-4 w-4" />
                  <span>Premium Game Guides & Tutorials</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
                  Level Up Your Gaming Skills
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Access high-quality video guides and professional commentaries
                  to master your favorite games.
                </p>
                <div className="flex items-center justify-center gap-4 pt-4">
                  <Link href="/browse">
                    <Button size="lg" className="gap-2 group">
                      Browse Library{" "}
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link href="/stream">
                    <Button variant="outline" size="lg" className="gap-2">
                      <VideoIcon className="h-4 w-4" /> Stream Videos
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <motion.div
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="grid md:grid-cols-3 gap-8"
            >
              <motion.div variants={item}>
                <Card className="group hover:shadow-lg transition-all">
                  <CardContent className="pt-8 pb-6 px-6 text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                      <Trophy className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-semibold">Pro-Level Guides</h3>
                    <p className="text-muted-foreground">
                      Learn from top players and improve your gameplay with
                      detailed strategies.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={item}>
                <Card className="group hover:shadow-lg transition-all">
                  <CardContent className="pt-8 pb-6 px-6 text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                      <MonitorPlay className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-semibold">HD Video Content</h3>
                    <p className="text-muted-foreground">
                      Watch and download high-quality videos with multiple
                      resolution options.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={item}>
                <Card className="group hover:shadow-lg transition-all">
                  <CardContent className="pt-8 pb-6 px-6 text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                      <Zap className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-semibold">Totally Free</h3>
                    <p className="text-muted-foreground">
                      No subscription fees, no ads, just high-quality content.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
