import { Link } from "wouter";
import { Calendar, Clock, UserCheck, ChevronRight } from "lucide-react";
import type { Session } from "@shared/schema";
import { format } from "date-fns";

interface SessionCardProps {
  session: Session;
}

export function SessionCard({ session }: SessionCardProps) {
  const isActive = session.status === "active";

  return (
    <div className={`
      group relative overflow-hidden rounded-2xl border bg-card p-6 transition-all duration-300
      hover:shadow-lg hover:-translate-y-1
      ${isActive ? "border-primary/20 shadow-primary/5" : "border-border shadow-sm"}
    `}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className={`
            inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors
            ${isActive 
              ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400" 
              : "bg-muted text-muted-foreground"}
          `}>
            {isActive ? "Live Session" : "Completed"}
            {isActive && <span className="ml-1.5 h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />}
          </span>
        </div>
        {session.startTime && (
          <span className="text-xs text-muted-foreground font-medium flex items-center">
            <Calendar className="w-3 h-3 mr-1" />
            {format(new Date(session.startTime), "MMM d, yyyy")}
          </span>
        )}
      </div>

      <h3 className="font-display text-xl font-bold mb-2 text-card-foreground group-hover:text-primary transition-colors">
        {session.name}
      </h3>

      <div className="flex items-center text-sm text-muted-foreground mb-6">
        <Clock className="w-4 h-4 mr-1.5" />
        {session.startTime ? format(new Date(session.startTime), "h:mm a") : "Not started"}
        {session.endTime && ` - ${format(new Date(session.endTime), "h:mm a")}`}
      </div>

      <div className="mt-auto">
        <Link href={`/session/${session.id}`} className={`
          inline-flex items-center justify-center w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-all
          ${isActive 
            ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20" 
            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}
        `}>
          {isActive ? "Join Session" : "View Report"}
          <ChevronRight className="w-4 h-4 ml-2" />
        </Link>
      </div>
    </div>
  );
}
