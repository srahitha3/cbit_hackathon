import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-warning/15 text-warning border-warning/30",
  approved: "bg-success/15 text-success border-success/30",
  rejected: "bg-destructive/15 text-destructive border-destructive/30",
};

export default function FacultyRequests() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<any>(null);
  const [remarks, setRemarks] = useState("");

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["faculty-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bonafide_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("bonafide_requests").update({
        status,
        remarks: remarks.trim().slice(0, 500),
        reviewed_by: user!.id,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["faculty-requests"] });
      toast({ title: "Request updated" });
      setSelected(null);
      setRemarks("");
    },
    onError: () => toast({ title: "Update failed", variant: "destructive" }),
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Student Requests</h1>
          <p className="text-muted-foreground">Review bonafide certificate requests</p>
        </div>
        <Card>
          <CardHeader><CardTitle>All Requests</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : requests.length === 0 ? (
              <p className="text-sm text-muted-foreground">No requests.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Date Needed</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Action</TableHead>
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
                      <TableCell>{new Date(r.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {r.status === "pending" && (
                          <Button size="sm" variant="outline" onClick={() => { setSelected(r); setRemarks(""); }}>
                            Review
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Request</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">Purpose</p>
                <p className="text-sm text-muted-foreground">{selected.purpose}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Date Needed</p>
                <p className="text-sm text-muted-foreground">{new Date(selected.date_needed).toLocaleDateString()}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Remarks (optional)</p>
                <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} maxLength={500} placeholder="Add remarks…" />
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => updateMutation.mutate({ id: selected.id, status: "approved" })}
                  disabled={updateMutation.isPending}
                >
                  <CheckCircle className="mr-1 h-4 w-4" /> Approve
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => updateMutation.mutate({ id: selected.id, status: "rejected" })}
                  disabled={updateMutation.isPending}
                >
                  <XCircle className="mr-1 h-4 w-4" /> Reject
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
