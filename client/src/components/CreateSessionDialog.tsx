import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSessionSchema, type CreateSessionRequest } from "@shared/schema";
import { useCreateSession } from "@/hooks/use-sessions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2 } from "lucide-react";

export function CreateSessionDialog() {
  const [open, setOpen] = useState(false);
  const { mutate, isPending } = useCreateSession();
  
  const form = useForm<CreateSessionRequest>({
    resolver: zodResolver(insertSessionSchema),
    defaultValues: {
      name: "",
      status: "active"
    }
  });

  const onSubmit = (data: CreateSessionRequest) => {
    mutate(data, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="rounded-xl bg-primary shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all">
          <Plus className="w-5 h-5 mr-2" />
          New Session
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Create Session</DialogTitle>
          <DialogDescription>
            Start a new attendance tracking session. The camera will be activated in the next step.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">Class Name</Label>
            <Input
              id="name"
              placeholder="e.g., Computer Science 101"
              className="h-11 rounded-xl"
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="rounded-xl min-w-[100px]">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Start"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
