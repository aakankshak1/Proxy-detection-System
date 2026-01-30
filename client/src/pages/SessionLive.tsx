import { useRoute } from "wouter";
import { useSession, useCompleteSession } from "@/hooks/use-sessions";
import { useAttendance } from "@/hooks/use-attendance";
import { CameraFeed } from "@/components/CameraFeed";
import { AttendanceList } from "@/components/AttendanceList";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, StopCircle, CheckCircle } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";

export default function SessionLive() {
  const [, params] = useRoute("/session/:id");
  const id = parseInt(params?.id || "0");
  
  const { data: session, isLoading: isLoadingSession } = useSession(id);
  const { data: records, isLoading: isLoadingAttendance } = useAttendance(id);
  const { mutate: completeSession, isPending: isCompleting } = useCompleteSession();

  if (isLoadingSession) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Session not found</h1>
        <Link href="/">
          <Button>Return Home</Button>
        </Link>
      </div>
    );
  }

  const isActive = session.status === "active";

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col p-4 md:p-6 lg:p-8 gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
              {session.name}
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Started {session.startTime && format(new Date(session.startTime), "h:mm a")}</span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span className={isActive ? "text-green-600 font-medium" : "text-muted-foreground"}>
                {isActive ? "Tracking Active" : "Session Completed"}
              </span>
            </div>
          </div>
        </div>

        {isActive ? (
          <Button 
            variant="destructive" 
            size="lg"
            className="rounded-xl shadow-lg shadow-destructive/20"
            disabled={isCompleting}
            onClick={() => completeSession(session.id)}
          >
            {isCompleting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <StopCircle className="w-4 h-4 mr-2" />
            )}
            End Session
          </Button>
        ) : (
          <div className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-xl dark:bg-green-500/20 dark:text-green-400">
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold">Completed</span>
          </div>
        )}
      </div>

      {/* Content Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        {/* Left: Camera (2 cols) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-card rounded-3xl border shadow-sm p-1">
            <CameraFeed sessionId={session.id} isActive={isActive} />
          </div>
          
          {/* Privacy Notice */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-800 rounded-xl p-4 text-sm text-blue-800 dark:text-blue-300">
            <p className="font-semibold mb-1">Privacy Notice</p>
            <p className="opacity-90">
              Face detection runs entirely in the browser. Only snapshots of detected faces are sent to the server for this specific session report. No biometric templates are permanently stored.
            </p>
          </div>
        </div>

        {/* Right: Attendance List (1 col) */}
        <div className="lg:col-span-1 h-[600px] lg:h-auto">
          {isLoadingAttendance ? (
            <div className="h-full flex items-center justify-center bg-card rounded-2xl border">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <AttendanceList 
              records={records || []} 
              sessionId={session.id} 
              readOnly={!isActive}
            />
          )}
        </div>
      </div>
    </div>
  );
}
