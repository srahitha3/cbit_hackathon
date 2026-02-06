import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarGroup, SidebarGroupLabel
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  GraduationCap, FileText, Receipt, Megaphone, Users, ClipboardList, LogOut, LayoutDashboard, Shield
} from "lucide-react";

const studentLinks = [
  { to: "/student", label: "Dashboard", icon: LayoutDashboard },
  { to: "/student/bonafide", label: "Bonafide Requests", icon: FileText },
  { to: "/student/receipts", label: "Fee Receipts", icon: Receipt },
  { to: "/student/notices", label: "Notices", icon: Megaphone },
];

const facultyLinks = [
  { to: "/faculty", label: "Dashboard", icon: LayoutDashboard },
  { to: "/faculty/requests", label: "Student Requests", icon: ClipboardList },
  { to: "/faculty/notices", label: "Notices", icon: Megaphone },
];

const adminLinks = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/users", label: "Manage Users", icon: Users },
  { to: "/admin/notices", label: "Manage Notices", icon: Megaphone },
  { to: "/admin/receipts", label: "Upload Receipts", icon: Receipt },
  { to: "/admin/audit", label: "Audit Logs", icon: Shield },
];

export default function AppSidebar() {
  const { role, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const links = role === "admin" ? adminLinks : role === "faculty" ? facultyLinks : studentLinks;

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
            <GraduationCap className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-sidebar-foreground">Campus Portal</p>
            <p className="truncate text-xs capitalize text-sidebar-foreground/60">{role} Panel</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarMenu>
            {links.map((link) => (
              <SidebarMenuItem key={link.to}>
                <SidebarMenuButton
                  isActive={location.pathname === link.to}
                  onClick={() => navigate(link.to)}
                  tooltip={link.label}
                >
                  <link.icon className="h-4 w-4" />
                  <span>{link.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="mb-2 truncate text-xs text-sidebar-foreground/70">
          {profile?.full_name || "User"}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4" /> Sign Out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
