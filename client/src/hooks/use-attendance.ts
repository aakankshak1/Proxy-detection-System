import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CreateAttendanceRequest, type UpdateAttendanceRequest } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useAttendance(sessionId: number) {
  return useQuery({
    queryKey: [api.attendance.list.path, sessionId],
    queryFn: async () => {
      const url = buildUrl(api.attendance.list.path, { sessionId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch attendance");
      return api.attendance.list.responses[200].parse(await res.json());
    },
    enabled: !!sessionId,
    refetchInterval: 2000, // Poll every 2s for updates
  });
}

export function useCreateAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAttendanceRequest) => {
      const res = await fetch(api.attendance.create.path, {
        method: api.attendance.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.attendance.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to record attendance");
      }
      return api.attendance.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      // Invalidate the specific session list
      const listUrl = buildUrl(api.attendance.list.path, { sessionId: variables.sessionId });
      queryClient.invalidateQueries({ queryKey: [api.attendance.list.path, variables.sessionId] });
    },
  });
}

export function useUpdateAttendance() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, sessionId, ...data }: UpdateAttendanceRequest & { id: number, sessionId: number }) => {
      const url = buildUrl(api.attendance.update.path, { id });
      const res = await fetch(url, {
        method: api.attendance.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to update record");
      return api.attendance.update.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.attendance.list.path, variables.sessionId] });
      toast({ title: "Updated", description: "Attendance record updated successfully." });
    },
  });
}

export function useDeleteAttendance() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, sessionId }: { id: number, sessionId: number }) => {
      const url = buildUrl(api.attendance.delete.path, { id });
      const res = await fetch(url, { method: api.attendance.delete.method, credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete record");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.attendance.list.path, variables.sessionId] });
      toast({ title: "Deleted", description: "Record removed from attendance." });
    },
  });
}
