import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Search } from "lucide-react";

export default function Notices() {
  const [search, setSearch] = useState("");

  const { data: notices = [], isLoading } = useQuery({
    queryKey: ["notices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notices")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = notices.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Campus Notices</h1>
          <p className="text-muted-foreground">Official announcements and updates</p>
        </div>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search notices…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            maxLength={100}
          />
        </div>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">No notices found.</p>
        ) : (
          <div className="space-y-4">
            {filtered.map((n) => (
              <Card key={n.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{n.title}</CardTitle>
                    <div className="flex gap-1">
                      {n.target_audience.map((a) => (
                        <Badge key={a} variant="secondary" className="text-xs capitalize">{a}</Badge>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(n.created_at).toLocaleDateString()}
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm">{n.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
