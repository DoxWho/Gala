"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils/formatting";
import { cn } from "@/lib/utils/cn";

interface ImpactBoardItemProps {
  item: {
    id: string;
    title: string;
    category: string;
    defaultAmount: string;
    isCustom: boolean;
    totalPledged: number;
    pledgeCount: number;
  };
  onClick: (id: string) => void;
}

const categoryColors: Record<string, string> = {
  shabbat: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  holidays: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
  education: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  operating: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
  wishlist: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-100",
};

export function ImpactBoardItemCard({ item, onClick }: ImpactBoardItemProps) {
  const defaultAmt = parseFloat(item.defaultAmount);
  const percentage = defaultAmt > 0 ? Math.min((item.totalPledged / defaultAmt) * 100, 100) : 0;
  const isFunded = item.totalPledged >= defaultAmt;

  return (
    <Card
      className={cn(
        "cursor-pointer transition-shadow hover:shadow-md",
        isFunded && "border-green-300 dark:border-green-700"
      )}
      onClick={() => onClick(item.id)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-medium leading-tight">
            {item.title}
          </CardTitle>
          <Badge className={cn("shrink-0 text-xs", categoryColors[item.category])}>
            {item.category}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold">
              {formatCurrency(item.totalPledged)}
            </span>
            <span className="text-xs text-muted-foreground">
              of {formatCurrency(defaultAmt)}
            </span>
          </div>
          <Progress value={percentage} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{item.pledgeCount} pledge{item.pledgeCount !== 1 ? "s" : ""}</span>
            {isFunded && (
              <Badge variant="success" className="text-xs">
                Funded
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
