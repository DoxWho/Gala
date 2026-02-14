"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc/client";
import type { AuctionItemWithWinner } from "@/types";

interface WinnerAssignmentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: AuctionItemWithWinner | null;
  parties: Array<{ id: string; partyName: string }>;
  eventId: string;
}

export function WinnerAssignment({
  open,
  onOpenChange,
  item,
  parties,
  eventId,
}: WinnerAssignmentProps) {
  const [winningPartyId, setWinningPartyId] = useState("");
  const [finalBidAmount, setFinalBidAmount] = useState("");

  const utils = trpc.useUtils();
  const assignWinner = trpc.auction.assignWinner.useMutation({
    onSuccess: () => {
      utils.auction.getAll.invalidate({ eventId });
      utils.auction.getTotalRevenue.invalidate({ eventId });
      utils.dashboard.getStats.invalidate({ eventId });
      onOpenChange(false);
      setWinningPartyId("");
      setFinalBidAmount("");
    },
  });

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Winner</DialogTitle>
          <DialogDescription>{item.title}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Winning Party</Label>
            <Select value={winningPartyId} onValueChange={setWinningPartyId}>
              <SelectTrigger>
                <SelectValue placeholder="Select winner..." />
              </SelectTrigger>
              <SelectContent>
                {parties.map((party) => (
                  <SelectItem key={party.id} value={party.id}>
                    {party.partyName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Final Bid Amount</Label>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={finalBidAmount}
              onChange={(e) => setFinalBidAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() =>
              assignWinner.mutate({
                auctionItemId: item.id,
                winningPartyId,
                finalBidAmount: parseFloat(finalBidAmount),
              })
            }
            disabled={
              assignWinner.isPending ||
              !winningPartyId ||
              !finalBidAmount
            }
          >
            {assignWinner.isPending ? "Assigning..." : "Assign Winner"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
