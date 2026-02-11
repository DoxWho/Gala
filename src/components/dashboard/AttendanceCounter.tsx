"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Users, UserCheck } from "lucide-react";

interface AttendanceCounterProps {
  totalGuests: number;
  checkedInGuests: number;
}

export function AttendanceCounter({
  totalGuests,
  checkedInGuests,
}: AttendanceCounterProps) {
  const percentage = totalGuests > 0 ? (checkedInGuests / totalGuests) * 100 : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Attendance</CardTitle>
        <Users className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">{checkedInGuests}</span>
          <span className="text-lg text-muted-foreground">/ {totalGuests}</span>
        </div>
        <Progress value={percentage} className="mt-3 h-2" />
        <p className="mt-2 text-xs text-muted-foreground">
          {percentage.toFixed(0)}% checked in
        </p>
      </CardContent>
    </Card>
  );
}
