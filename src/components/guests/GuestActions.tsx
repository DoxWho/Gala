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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Ticket, Heart, DollarSign } from "lucide-react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { toast } from "@/hooks/useToast";
import { RAFFLE_PRICE, FIFTY_FIFTY_PRICE } from "@/lib/constants";

interface GuestActionsProps {
  guestId: string;
  guestName: string;
  eventId: string;
}

export function GuestActions({ guestId, guestName, eventId }: GuestActionsProps) {
  const [raffleOpen, setRaffleOpen] = useState(false);
  const [fiftyFiftyOpen, setFiftyFiftyOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const utils = trpc.useUtils();

  const recordRaffleSale = trpc.raffle.recordRaffleSale.useMutation({
    onSuccess: () => {
      utils.guests.getAll.invalidate();
      utils.raffle.getRaffleTotals.invalidate({ eventId });
      utils.dashboard.getStats.invalidate({ eventId });
      setRaffleOpen(false);
      setQuantity(1);
      toast({ title: "Raffle tickets sold", variant: "success" });
    },
    onError: (err) => {
      toast({ title: "Failed to record sale", description: err.message, variant: "destructive" });
    },
  });

  const recordFiftyFiftySale = trpc.raffle.recordFiftyFiftySale.useMutation({
    onSuccess: () => {
      utils.guests.getAll.invalidate();
      utils.raffle.getFiftyFiftyTotals.invalidate({ eventId });
      utils.dashboard.getStats.invalidate({ eventId });
      setFiftyFiftyOpen(false);
      setQuantity(1);
      toast({ title: "50/50 tickets sold", variant: "success" });
    },
    onError: (err) => {
      toast({ title: "Failed to record sale", description: err.message, variant: "destructive" });
    },
  });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setRaffleOpen(true)}>
            <Ticket className="mr-2 h-4 w-4" />
            Sell Raffle Tickets
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setFiftyFiftyOpen(true)}>
            <DollarSign className="mr-2 h-4 w-4" />
            Sell 50/50 Tickets
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/impact-board?guestId=${guestId}`}>
              <Heart className="mr-2 h-4 w-4" />
              Manage Pledges
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Raffle Sale Dialog */}
      <Dialog open={raffleOpen} onOpenChange={setRaffleOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Sell Raffle Tickets</DialogTitle>
            <DialogDescription>For: {guestName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Quantity</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </Button>
                <Input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="text-center w-20"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </Button>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Price per ticket: ${RAFFLE_PRICE.toFixed(2)}
            </div>
            <div className="text-lg font-bold">
              Total: ${(quantity * RAFFLE_PRICE).toFixed(2)}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRaffleOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                recordRaffleSale.mutate({
                  guestId,
                  quantity,
                  pricePerTicket: RAFFLE_PRICE,
                })
              }
              disabled={recordRaffleSale.isPending}
            >
              {recordRaffleSale.isPending ? "Recording..." : "Record Sale"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 50/50 Sale Dialog */}
      <Dialog open={fiftyFiftyOpen} onOpenChange={setFiftyFiftyOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Sell 50/50 Tickets</DialogTitle>
            <DialogDescription>For: {guestName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Quantity</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </Button>
                <Input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="text-center w-20"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </Button>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Price per ticket: ${FIFTY_FIFTY_PRICE.toFixed(2)}
            </div>
            <div className="text-lg font-bold">
              Total: ${(quantity * FIFTY_FIFTY_PRICE).toFixed(2)}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFiftyFiftyOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                recordFiftyFiftySale.mutate({
                  guestId,
                  quantity,
                  pricePerTicket: FIFTY_FIFTY_PRICE,
                })
              }
              disabled={recordFiftyFiftySale.isPending}
            >
              {recordFiftyFiftySale.isPending ? "Recording..." : "Record Sale"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
