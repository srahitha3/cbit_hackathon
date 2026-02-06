import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

export default function UploadReceipts() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [receiptName, setReceiptName] = useState("");
  const [amount, setAmount] = useState("");
  const [file, setFile] = useState<File | null>(null);

  // Fetch students
  const { data: students = [] } = useQuery({
    queryKey: ["admin-students"],
    queryFn: async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "student");
      if (!roles?.length) return [];
      const ids = roles.map((r) => r.user_id);
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, enrollment_number").in("user_id", ids);
      return profiles || [];
    },
  });

  // Fetch all receipts
  const { data: receipts = [], isLoading } = useQuery({
    queryKey: ["admin-receipts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("fee_receipts").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file || !studentId || !receiptName || !amount) throw new Error("All fields required");
      const filePath = `${studentId}/${Date.now()}_${file.name}`;
      const { error: uploadErr } = await supabase.storage.from("fee-receipts").upload(filePath, file);
      if (uploadErr) throw uploadErr;
      const { error } = await supabase.from("fee_receipts").insert({
        student_id: studentId,
        receipt_name: receiptName.trim().slice(0, 200),
        amount: parseFloat(amount),
        file_path: filePath,
        uploaded_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-receipts"] });
      toast({ title: "Receipt uploaded" });
      setStudentId(""); setReceiptName(""); setAmount(""); setFile(null);
      setOpen(false);
    },
    onError: (e) => toast({ title: e.message || "Upload failed", variant: "destructive" }),
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Upload Receipts</h1>
            <p className="text-muted-foreground">Upload fee receipts for students</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Upload Receipt</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Upload Fee Receipt</DialogTitle></DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); uploadMutation.mutate(); }} className="space-y-4">
                <div className="space-y-2">
                  <Label>Student</Label>
                  <Select value={studentId} onValueChange={setStudentId}>
                    <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                    <SelectContent>
                      {students.map((s) => (
                        <SelectItem key={s.user_id} value={s.user_id}>
                          {s.full_name} ({s.enrollment_number || "N/A"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Receipt Name</Label>
                  <Input value={receiptName} onChange={(e) => setReceiptName(e.target.value)} required maxLength={200} />
                </div>
                <div className="space-y-2">
                  <Label>Amount (₹)</Label>
                  <Input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>File</Label>
                  <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} required accept=".pdf,.jpg,.jpeg,.png" />
                </div>
                <Button type="submit" className="w-full" disabled={uploadMutation.isPending}>
                  {uploadMutation.isPending ? "Uploading…" : "Upload"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader><CardTitle>All Receipts</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : receipts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No receipts yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receipts.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.receipt_name}</TableCell>
                      <TableCell>₹{Number(r.amount).toLocaleString()}</TableCell>
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
