import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "@/pages/Login";
import Unauthorized from "@/pages/Unauthorized";
import NotFound from "./pages/NotFound";

// Student pages
import StudentDashboard from "@/pages/student/StudentDashboard";
import BonafideRequests from "@/pages/student/BonafideRequests";
import FeeReceipts from "@/pages/student/FeeReceipts";
import Notices from "@/pages/student/Notices";

// Faculty pages
import FacultyDashboard from "@/pages/faculty/FacultyDashboard";
import FacultyRequests from "@/pages/faculty/FacultyRequests";

// Admin pages
import AdminDashboard from "@/pages/admin/AdminDashboard";
import ManageUsers from "@/pages/admin/ManageUsers";
import ManageNotices from "@/pages/admin/ManageNotices";
import UploadReceipts from "@/pages/admin/UploadReceipts";
import AuditLogs from "@/pages/admin/AuditLogs";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Student routes */}
            <Route path="/student" element={<ProtectedRoute allowedRoles={["student"]}><StudentDashboard /></ProtectedRoute>} />
            <Route path="/student/bonafide" element={<ProtectedRoute allowedRoles={["student"]}><BonafideRequests /></ProtectedRoute>} />
            <Route path="/student/receipts" element={<ProtectedRoute allowedRoles={["student"]}><FeeReceipts /></ProtectedRoute>} />
            <Route path="/student/notices" element={<ProtectedRoute allowedRoles={["student"]}><Notices /></ProtectedRoute>} />

            {/* Faculty routes */}
            <Route path="/faculty" element={<ProtectedRoute allowedRoles={["faculty"]}><FacultyDashboard /></ProtectedRoute>} />
            <Route path="/faculty/requests" element={<ProtectedRoute allowedRoles={["faculty"]}><FacultyRequests /></ProtectedRoute>} />
            <Route path="/faculty/notices" element={<ProtectedRoute allowedRoles={["faculty"]}><Notices /></ProtectedRoute>} />

            {/* Admin routes */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute allowedRoles={["admin"]}><ManageUsers /></ProtectedRoute>} />
            <Route path="/admin/notices" element={<ProtectedRoute allowedRoles={["admin"]}><ManageNotices /></ProtectedRoute>} />
            <Route path="/admin/receipts" element={<ProtectedRoute allowedRoles={["admin"]}><UploadReceipts /></ProtectedRoute>} />
            <Route path="/admin/audit" element={<ProtectedRoute allowedRoles={["admin"]}><AuditLogs /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
