import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Receipt, Megaphone } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function StudentDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const cards = [
    { title: "Bonafide Requests", desc: "Request & track certificates", icon: FileText, to: "/student/bonafide" },
    { title: "Fee Receipts", desc: "View & download receipts", icon: Receipt, to: "/student/receipts" },
    { title: "Notices", desc: "View campus notices", icon: Megaphone, to: "/student/notices" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {profile?.full_name || "Student"}</h1>
          <p className="text-muted-foreground">Access your campus services below</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <Card
              key={c.to}
              className="cursor-pointer transition-shadow hover:shadow-lg"
              onClick={() => navigate(c.to)}
            >
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <c.icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{c.title}</CardTitle>
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
