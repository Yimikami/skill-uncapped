import { cn } from "@/lib/utils";

export function Footer({ className }: React.HTMLAttributes<HTMLElement>) {
  return (
    <footer className={cn("border-t py-6", className)}>
      <div className="container mx-auto px-4 flex items-center justify-center min-h-[5rem]">
        <p className="text-center text-sm leading-loose text-muted-foreground max-w-3xl">
          This is an unofficial project and is not affiliated with, endorsed by,
          or connected to Skill-Capped in any way. The project is intended
          solely for educational and learning purposes. Any resemblance to
          existing platforms is purely coincidental and serves only as a
          learning reference.
        </p>
      </div>
    </footer>
  );
}
