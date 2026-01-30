import { useSessions } from "@/hooks/use-sessions";
import { CreateSessionDialog } from "@/components/CreateSessionDialog";
import { SessionCard } from "@/components/SessionCard";
import { Loader2, BookOpen } from "lucide-react";

export default function Dashboard() {
  const { data: sessions, isLoading, error } = useSessions();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-8 text-center text-destructive">
        Failed to load sessions. Please try again later.
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8 md:py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
            Classroom Dashboard
          </h1>
          <p className="text-muted-foreground text-lg">
            Manage your attendance sessions and view reports.
          </p>
        </div>
        <CreateSessionDialog />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sessions?.length === 0 ? (
          <div className="col-span-full py-16 text-center rounded-3xl border border-dashed border-border bg-muted/20">
            <div className="bg-muted inline-flex p-4 rounded-full mb-4">
              <BookOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold font-display mb-2">No sessions yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Create your first session to start tracking attendance using facial recognition.
            </p>
            <CreateSessionDialog />
          </div>
        ) : (
          sessions?.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))
        )}
      </div>
    </main>
  );
}
