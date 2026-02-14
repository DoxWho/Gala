"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/formatting";
import { Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

interface PledgeListProps {
  pledges: Array<{
    id: string;
    amount: string;
    donationType: string;
    notes: string | null;
    guest: {
      id: string;
      firstName: string;
      lastName: string;
    };
  }>;
  impactBoardItemId: string;
  eventId: string;
}

export function PledgeList({ pledges, impactBoardItemId, eventId }: PledgeListProps) {
  const utils = trpc.useUtils();

  const deletePledge = trpc.pledges.delete.useMutation({
    onSuccess: () => {
      utils.impactBoard.getById.invalidate({ id: impactBoardItemId });
      utils.impactBoard.getAll.invalidate();
      utils.dashboard.getStats.invalidate({ eventId });
    },
  });

  if (pledges.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No pledges yet
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {pledges.map((pledge) => (
        <div
          key={pledge.id}
          className="flex items-center justify-between rounded-lg border p-3"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">
                {pledge.guest.firstName} {pledge.guest.lastName}
              </span>
              <Badge
                variant={
                  pledge.donationType === "pre_pledged" ? "secondary" : "default"
                }
                className="text-xs"
              >
                {pledge.donationType === "pre_pledged"
                  ? "Pre-Pledged"
                  : "Gala Night"}
              </Badge>
            </div>
            {pledge.notes && (
              <p className="text-xs text-muted-foreground mt-1">
                {pledge.notes}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">
              {formatCurrency(parseFloat(pledge.amount))}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={() => deletePledge.mutate({ id: pledge.id })}
              disabled={deletePledge.isPending}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
