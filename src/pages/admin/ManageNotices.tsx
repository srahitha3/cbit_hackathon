import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

const noticeSchema = z.object({
  title: z.string().trim().min(1, "Title required").max(200),
  content: z.string().trim().min(1, "Content required").max(5000),
  target_audience: z.array(z.enum(["student", "faculty", "admin"])).min(1, "Select at least one audience"),
});

export default function ManageNotices() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [audience, setAudience] = useState<AppRole[]>(["student", "faculty", "admin"]);

  const { data: notices = [], isLoading } = useQuery({
    queryKey: ["admin-notices"],
    queryFn: async () => {
      const { data, error } = await supabase.from("notices").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: z.infer<typeof noticeSchema>) => {
      const { error } = await supabase.from("notices").insert({
        title: values.title,
        content: values.content,
        target_audience: values.target_audience,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-notices"] });
      toast({ title: "Notice published" });
      setTitle(""); setContent(""); setAudience(["student", "faculty", "admin"]);
      setOpen(false);
    },
    onError: () => toast({ title: "Failed to publish", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-notices"] });
      toast({ title: "Notice deleted" });
    },
  });

  const toggleAudience = (role: AppRole) => {
    setAudience((prev) => prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = noticeSchema.safeParse({ title, content, target_audience: audience });
    if (!parsed.success) {
      toast({ title: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }
    createMutation.mutate(parsed.data);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Manage Notices</h1>
            <p className="text-muted-foreground">Create and manage campus notices</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> New Notice</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Notice</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} />
                </div>
                <div className="space-y-2">
                  <Label>Content</Label>
                  <Textarea value={content} onChange={(e) => setContent(e.target.value)} required maxLength={5000} rows={5} />
                </div>
                <div className="space-y-2">
                  <Label>Target Audience</Label>
                  <div className="flex gap-4">
                    {(["student", "faculty", "admin"] as AppRole[]).map((r) => (
                      <label key={r} className="flex items-center gap-2 text-sm capitalize">
                        <Checkbox checked={audience.includes(r)} onCheckedChange={() => toggleAudience(r)} />
                        {r}
                      </label>
                    ))}
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Publishing…" : "Publish Notice"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader><CardTitle>All Notices</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : notices.length === 0 ? (
              <p className="text-sm text-muted-foreground">No notices yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Audience</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notices.map((n) => (
                    <TableRow key={n.id}>
                      <TableCell className="max-w-[200px] truncate">{n.title}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {n.target_audience.map((a) => (
                            <Badge key={a} variant="secondary" className="text-xs capitalize">{a}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{new Date(n.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(n.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
