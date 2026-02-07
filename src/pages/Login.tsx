import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Shield } from "lucide-react";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().email("Valid email required").max(255),
  password: z.string().min(1, "Password required").max(128),
});

export default function Login() {
  const { user, role, signIn, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user && role) {
    const dest = role === "admin" ? "/admin" : role === "faculty" ? "/faculty" : "/student";
    return <Navigate to={dest} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const { error: err } = await signIn(parsed.data.email, parsed.data.password);
    if (err) {
      setError(err);
      setSubmitting(false);
    }
    // Don't set submitting to false on success - let the navigation happen
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary">
            <GraduationCap className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-primary">Campus Portal</h1>
          <p className="mt-1 text-muted-foreground">Secure Campus Services</p>
        </div>

        <Card className="border-border/60 shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Shield className="h-5 w-5 text-accent" /> Sign In
            </CardTitle>
            <CardDescription>Access your campus services securely</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="your@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  maxLength={255}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  maxLength={128}
                />
              </div>
              {error && (
                <p className="text-sm font-medium text-destructive">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={submitting || loading}>
                {submitting ? "Signing in…" : "Sign In"}
              </Button>
            </form>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Contact your administrator for account access
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}