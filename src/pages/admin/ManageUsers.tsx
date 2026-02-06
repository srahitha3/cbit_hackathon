import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import { z } from "zod";

const createUserSchema = z.object({
  email: z.string().trim().email("Valid email required").max(255),
  password: z.string().min(8, "Min 8 characters").max(128),
  full_name: z.string().trim().min(1, "Name required").max(100),
  role: z.enum(["student", "faculty", "admin"]),
  department: z.string().max(100).optional(),
  enrollment_number: z.string().max(50).optional(),
});

export default function ManageUsers() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", full_name: "", role: "student" as string, department: "", enrollment_number: "" });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: roles, error } = await supabase.from("user_roles").select("user_id, role");
      if (error) throw error;
      const { data: profiles, error: pErr } = await supabase.from("profiles").select("user_id, full_name, department, enrollment_number");
      if (pErr) throw pErr;
      return roles.map((r) => {
        const p = profiles.find((p) => p.user_id === r.user_id);
        return { ...r, ...p };
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: z.infer<typeof createUserSchema>) => {
      const { data, error } = await supabase.functions.invoke("admin-create-user", {
        body: values,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "User created successfully" });
      setForm({ email: "", password: "", full_name: "", role: "student", department: "", enrollment_number: "" });
      setOpen(false);
    },
    onError: (e) => toast({ title: e.message || "Failed to create user", variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = createUserSchema.safeParse(form);
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
            <h1 className="text-2xl font-bold">Manage Users</h1>
            <p className="text-muted-foreground">Create and view user accounts</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Create User</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create New User</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required maxLength={255} />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} maxLength={128} />
                </div>
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required maxLength={100} />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="faculty">Faculty</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} maxLength={100} />
                </div>
                {form.role === "student" && (
                  <div className="space-y-2">
                    <Label>Enrollment Number</Label>
                    <Input value={form.enrollment_number} onChange={(e) => setForm({ ...form, enrollment_number: e.target.value })} maxLength={50} />
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating…" : "Create User"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader><CardTitle>All Users</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : users.length === 0 ? (
              <p className="text-sm text-muted-foreground">No users found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Enrollment #</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.user_id}>
                      <TableCell>{u.full_name || "—"}</TableCell>
                      <TableCell><Badge variant="secondary" className="capitalize">{u.role}</Badge></TableCell>
                      <TableCell>{u.department || "—"}</TableCell>
                      <TableCell>{u.enrollment_number || "—"}</TableCell>
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
