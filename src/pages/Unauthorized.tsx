import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function Unauthorized() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <ShieldX className="h-16 w-16 text-destructive" />
      <h1 className="text-2xl font-bold">Access Denied</h1>
      <p className="text-muted-foreground">You don't have permission to access this page.</p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
        <Button variant="destructive" onClick={signOut}>Sign Out</Button>
      </div>
    </div>
  );
}
