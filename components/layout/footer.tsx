import { cn } from "@/lib/utils";
import Link from "next/link";

export function Footer({ className }: React.HTMLAttributes<HTMLElement>) {
  return (
    <footer className={cn("border-t", className)}>
      <div className="container mx-auto px-4 py-8 sm:py-12">
        {/* Disclaimer and Copyright */}

        <p className="text-center text-sm text-muted-foreground">
          This is an unofficial project and is not affiliated with Skill-Capped
          or Riot Games. League of Legends and Valorant are registered
          trademarks of Riot Games. All videos, commentaries, and courses are
          property of Skill-Capped. This project is intended solely for
          educational and learning purposes.
        </p>
        <p className="text-center text-sm text-muted-foreground mt-4">
          © {new Date().getFullYear()} SkillUncapped.{" "}
          <Link
            className="text-primary"
            href="https://github.com/Yimikami/skill-uncapped"
          >
            Open source project.
          </Link>
        </p>
      </div>
    </footer>
  );
}
