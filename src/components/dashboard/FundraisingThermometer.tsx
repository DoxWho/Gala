"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/formatting";
import { Target } from "lucide-react";

interface FundraisingThermometerProps {
  totalRaised: number;
  goalAmount: number;
}

export function FundraisingThermometer({
  totalRaised,
  goalAmount,
}: FundraisingThermometerProps) {
  const percentage = goalAmount > 0 ? Math.min((totalRaised / goalAmount) * 100, 100) : 0;
  const isGoalMet = totalRaised >= goalAmount;

  return (
    <Card className={isGoalMet ? "border-green-500 bg-green-50 dark:bg-green-950/20" : ""}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Total Raised</CardTitle>
        <Target className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{formatCurrency(totalRaised)}</div>
        <div className="mt-3 relative">
          {/* Thermometer container */}
          <div className="h-6 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${percentage}%`,
                background: isGoalMet
                  ? "linear-gradient(90deg, #22c55e, #16a34a)"
                  : "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary)/0.8))",
              }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>{percentage.toFixed(0)}% of goal</span>
            <span>Goal: {formatCurrency(goalAmount)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
