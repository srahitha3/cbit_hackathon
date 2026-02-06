import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Megaphone, Receipt, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const cards = [
    { title: "Manage Users", desc: "Create and manage user accounts", icon: Users, to: "/admin/users" },
    { title: "Manage Notices", desc: "Create and publish notices", icon: Megaphone, to: "/admin/notices" },
    { title: "Upload Receipts", desc: "Upload fee receipts for students", icon: Receipt, to: "/admin/receipts" },
    { title: "Audit Logs", desc: "View system activity logs", icon: Shield, to: "/admin/audit" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Welcome, {profile?.full_name || "Administrator"}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => (
            <Card key={c.to} className="cursor-pointer transition-shadow hover:shadow-lg" onClick={() => navigate(c.to)}>
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <c.icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-base">{c.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{c.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
