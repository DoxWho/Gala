"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { formatCurrency } from "@/lib/utils/formatting";
import { Download, Upload, BarChart3, FileSpreadsheet } from "lucide-react";

export default function ReportsPage() {
  const { data: session } = useSession();
  const { data: event, isLoading: eventLoading } =
    trpc.dashboard.getActiveEvent.useQuery();

  const { data: stats } = trpc.dashboard.getStats.useQuery(
    { eventId: event?.id ?? "" },
    { enabled: !!event?.id }
  );

  const { data: impactTotals } = trpc.impactBoard.getTotals.useQuery(
    { eventId: event?.id ?? "" },
    { enabled: !!event?.id }
  );

  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    importedCount: number;
    errors: string[];
  } | null>(null);

  const isAdmin = session?.user?.role === "admin";

  async function handleExport() {
    if (!event) return;
    window.open(`/api/csv/export?eventId=${event.id}`, "_blank");
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !event) return;

    setImporting(true);
    setImportResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("eventId", event.id);

    try {
      const res = await fetch("/api/csv/import", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();
      setImportResult(result);
    } catch {
      setImportResult({
        success: false,
        importedCount: 0,
        errors: ["Failed to import CSV"],
      });
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  }

  if (eventLoading) {
    return <LoadingSpinner text="Loading..." className="py-12" />;
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-lg font-semibold">No Active Event</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports & Data</h1>
        <p className="text-sm text-muted-foreground">
          View reports, import guest lists, and export event data
        </p>
      </div>

      {/* Summary Cards */}
      {stats && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Raised
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(stats.totalRaised)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Goal Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.goalAmount > 0
                  ? `${((stats.totalRaised / stats.goalAmount) * 100).toFixed(1)}%`
                  : "N/A"}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.checkedInGuests} / {stats.totalGuests}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Gala Night Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(
                  stats.galaNightDonations +
                    stats.raffleRevenue +
                    stats.fiftyFiftyRevenue +
                    stats.auctionRevenue
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Impact Board Totals */}
      {impactTotals && impactTotals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Impact Board Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {impactTotals.map((cat) => (
                <div
                  key={cat.category}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <div className="font-medium text-sm capitalize">
                      {cat.category}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {cat.itemCount} items | {cat.pledgeCount} pledges
                    </div>
                  </div>
                  <div className="font-bold">
                    {formatCurrency(cat.totalPledged)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* CSV Operations */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Data
            </CardTitle>
            <CardDescription>
              Download complete event data as CSV for accounting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleExport} className="w-full gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Export to CSV
            </Button>
          </CardContent>
        </Card>

        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Import Guest List
              </CardTitle>
              <CardDescription>
                Upload a CSV file with guest data (admin only)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="csvFile">CSV File</Label>
                <Input
                  id="csvFile"
                  type="file"
                  accept=".csv"
                  onChange={handleImport}
                  disabled={importing}
                  className="mt-2"
                />
              </div>
              <div className="text-xs text-muted-foreground">
                Required columns: partyName, firstName, lastName
                <br />
                Optional: email, phone, primaryContact
              </div>

              {importing && (
                <LoadingSpinner size="sm" text="Importing..." />
              )}

              {importResult && (
                <div
                  className={`rounded-md p-3 text-sm ${
                    importResult.success
                      ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-100"
                      : "bg-destructive/10 text-destructive"
                  }`}
                >
                  <p className="font-medium">
                    {importResult.success
                      ? `Successfully imported ${importResult.importedCount} guests`
                      : `Imported ${importResult.importedCount} guests with errors`}
                  </p>
                  {importResult.errors.length > 0 && (
                    <ul className="mt-2 list-disc pl-4">
                      {importResult.errors.slice(0, 5).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                      {importResult.errors.length > 5 && (
                        <li>...and {importResult.errors.length - 5} more errors</li>
                      )}
                    </ul>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
