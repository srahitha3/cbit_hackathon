import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function FeeReceipts() {
  const { data: receipts = [], isLoading } = useQuery({
    queryKey: ["fee-receipts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fee_receipts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleDownload = async (filePath: string, name: string) => {
    const { data, error } = await supabase.storage.from("fee-receipts").download(filePath);
    if (error) {
      toast({ title: "Download failed", variant: "destructive" });
      return;
    }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Fee Receipts</h1>
          <p className="text-muted-foreground">View and download your fee receipts</p>
        </div>
        <Card>
          <CardHeader><CardTitle>Your Receipts</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : receipts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No receipts available.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receipts.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.receipt_name}</TableCell>
                      <TableCell>₹{Number(r.amount).toLocaleString()}</TableCell>
                      <TableCell>{new Date(r.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => handleDownload(r.file_path, r.receipt_name)}>
                          <Download className="mr-1 h-3 w-3" /> Download
                        </Button>
                      </TableCell>
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
