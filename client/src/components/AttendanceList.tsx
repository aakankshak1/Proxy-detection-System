import { useState } from "react";
import type { AttendanceRecord } from "@shared/schema";
import { useUpdateAttendance, useDeleteAttendance } from "@/hooks/use-attendance";
import { format } from "date-fns";
import { 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  Search,
  User,
  Clock
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface AttendanceListProps {
  records: AttendanceRecord[];
  sessionId: number;
  readOnly?: boolean;
}

export function AttendanceList({ records, sessionId, readOnly = false }: AttendanceListProps) {
  const [search, setSearch] = useState("");
  
  const filteredRecords = records.filter(r => 
    r.studentName.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime());

  return (
    <div className="flex flex-col h-full bg-card rounded-2xl border shadow-sm overflow-hidden">
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-lg">Attendance Log</h3>
          <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-md">
            {records.length} Present
          </span>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search students..." 
            className="pl-9 h-9 bg-background border-transparent focus:bg-background focus:border-primary transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
        {filteredRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <User className="w-8 h-8 mb-2 opacity-20" />
            <p className="text-sm">No students detected yet</p>
          </div>
        ) : (
          filteredRecords.map(record => (
            <AttendanceItem 
              key={record.id} 
              record={record} 
              sessionId={sessionId}
              readOnly={readOnly}
            />
          ))
        )}
      </div>
    </div>
  );
}

function AttendanceItem({ record, sessionId, readOnly }: { record: AttendanceRecord, sessionId: number, readOnly: boolean }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(record.studentName);
  
  const { mutate: update } = useUpdateAttendance();
  const { mutate: remove } = useDeleteAttendance();

  const handleSave = () => {
    if (editedName.trim() !== record.studentName) {
      update({ id: record.id, sessionId, studentName: editedName });
    }
    setIsEditing(false);
  };

  return (
    <div className="group flex items-center gap-3 p-3 rounded-xl bg-background border border-transparent hover:border-border hover:shadow-sm transition-all animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="relative h-12 w-12 flex-shrink-0 rounded-lg overflow-hidden bg-muted border border-border">
        {record.snapshot ? (
          <img src={record.snapshot} alt={record.studentName} className="h-full w-full object-cover" />
        ) : (
          <User className="h-6 w-6 m-auto text-muted-foreground" />
        )}
        <div className="absolute bottom-0 right-0 bg-green-500 text-[10px] text-white px-1 font-bold">
          {record.confidence}%
        </div>
      </div>

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input 
              value={editedName} 
              onChange={(e) => setEditedName(e.target.value)}
              className="h-8 text-sm"
              autoFocus
            />
            <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={handleSave}>
              <Check className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setIsEditing(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <>
            <h4 className="font-bold text-sm truncate text-foreground">{record.studentName}</h4>
            <div className="flex items-center text-xs text-muted-foreground mt-0.5">
              <Clock className="w-3 h-3 mr-1" />
              {record.timestamp ? format(new Date(record.timestamp), "h:mm:ss a") : "--"}
            </div>
          </>
        )}
      </div>

      {!readOnly && !isEditing && (
        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-8 w-8 text-muted-foreground hover:text-primary"
            onClick={() => setIsEditing(true)}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove Record?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will delete the attendance record for "{record.studentName}". This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  className="bg-destructive hover:bg-destructive/90"
                  onClick={() => remove({ id: record.id, sessionId })}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}
