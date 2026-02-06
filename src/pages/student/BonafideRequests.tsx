import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import { z } from "zod";

const requestSchema = z.object({
  purpose: z.string().trim().min(1, "Purpose required").max(500),
  date_needed: z.string().min(1, "Date required"),
});

const statusColors: Record<string, string> = {
  pending: "bg-warning/15 text-warning border-warning/30",
  approved: "bg-success/15 text-success border-success/30",
  rejected: "bg-destructive/15 text-destructive border-destructive/30",
};

export default function BonafideRequests() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [purpose, setPurpose] = useState("");
  const [dateNeeded, setDateNeeded] = useState("");

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["bonafide-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bonafide_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: { purpose: string; date_needed: string }) => {
      const { error } = await supabase.from("bonafide_requests").insert({
        student_id: user!.id,
        purpose: values.purpose,
        date_needed: values.date_needed,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bonafide-requests"] });
      toast({ title: "Request submitted successfully" });
      setPurpose("");
      setDateNeeded("");
      setOpen(false);
    },
    onError: () => toast({ title: "Failed to submit request", variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = requestSchema.safeParse({ purpose, date_needed: dateNeeded });
    if (!parsed.success) {
      toast({ title: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }
    createMutation.mutate({ purpose: parsed.data.purpose, date_needed: parsed.data.date_needed });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Bonafide Requests</h1>
            <p className="text-muted-foreground">Submit and track certificate requests</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> New Request</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Bonafide Request</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Purpose</Label>
                  <Textarea placeholder="Purpose of the certificate..." value={purpose} onChange={(e) => setPurpose(e.target.value)} maxLength={500} required />
                </div>
                <div className="space-y-2">
                  <Label>Date Needed</Label>
                  <Input type="date" value={dateNeeded} onChange={(e) => setDateNeeded(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Submitting…" : "Submit Request"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader><CardTitle>Your Requests</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : requests.length === 0 ? (
              <p className="text-sm text-muted-foreground">No requests yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Date Needed</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead>Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="max-w-[200px] truncate">{r.purpose}</TableCell>
                      <TableCell>{new Date(r.date_needed).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[r.status] || ""}>{r.status}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">{r.remarks || "—"}</TableCell>
                      <TableCell>{new Date(r.created_at).toLocaleDateString()}</TableCell>
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
