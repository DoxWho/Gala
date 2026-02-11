"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/formatting";
import { Gavel, Trophy } from "lucide-react";
import type { AuctionItemWithWinner } from "@/types";

interface AuctionItemCardProps {
  item: AuctionItemWithWinner;
  onAssignWinner: (item: AuctionItemWithWinner) => void;
}

export function AuctionItemCard({ item, onAssignWinner }: AuctionItemCardProps) {
  const isSold = !!item.finalBidAmount;

  return (
    <Card className={isSold ? "border-green-300 dark:border-green-700" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
          {isSold ? (
            <Badge variant="success">
              <Trophy className="mr-1 h-3 w-3" />
              Sold
            </Badge>
          ) : (
            <Badge variant="outline">
              <Gavel className="mr-1 h-3 w-3" />
              Available
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {item.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {item.description}
            </p>
          )}

          {item.estimatedValue && (
            <div className="text-xs text-muted-foreground">
              Est. Value: {formatCurrency(parseFloat(item.estimatedValue))}
            </div>
          )}

          {isSold && item.winningParty ? (
            <div className="space-y-1">
              <div className="text-sm font-bold text-green-600">
                {formatCurrency(parseFloat(item.finalBidAmount!))}
              </div>
              <div className="text-xs text-muted-foreground">
                Won by: {item.winningParty.partyName}
              </div>
            </div>
          ) : (
            <Button
              size="sm"
              className="w-full"
              onClick={() => onAssignWinner(item)}
            >
              Assign Winner
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
