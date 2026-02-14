"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { OfflineIndicator } from "@/components/shared/OfflineIndicator";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { useSync } from "@/hooks/useSync";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  useSync();

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>
      <OfflineIndicator />
    </div>
  );
}
