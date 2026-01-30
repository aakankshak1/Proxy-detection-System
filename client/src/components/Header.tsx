import { Link } from "wouter";
import { Video } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold text-primary hover:opacity-80 transition-opacity">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Video className="w-5 h-5 text-primary" />
          </div>
          <span>SmartAttend</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
            Dashboard
          </Link>
        </nav>
      </div>
    </header>
  );
}
