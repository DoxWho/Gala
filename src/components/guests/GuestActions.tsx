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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Ticket, Heart, DollarSign } from "lucide-react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { toast } from "@/hooks/useToast";

interface GuestActionsProps {
  guestId: string;
  guestName: string;
  eventId: string;
}

export function GuestActions({
  guestId,
  guestName,
  eventId,
}: GuestActionsProps) {
  const [raffleOpen, setRaffleOpen] = useState(false);
  const [fiftyFiftyOpen, setFiftyFiftyOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const utils = trpc.useUtils();

  // Fetch event settings for pricing
  const { data: event } = trpc.dashboard.getActiveEvent.useQuery();

  const rafflePricePerTicket = parseFloat(
    event?.rafflePricePerTicket || "10.00"
  );
  const fiftyFiftyPricePerTicket = parseFloat(
    event?.fiftyFiftyPricePerTicket || "25.00"
  );
  const fiftyFiftyBundleQty = event?.fiftyFiftyBundleQty ?? 5;
  const fiftyFiftyBundlePrice = parseFloat(
    event?.fiftyFiftyBundlePrice || "100.00"
  );

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
      toast({
        title: "Failed to record sale",
        description: err.message,
        variant: "destructive",
      });
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
      toast({
        title: "Failed to record sale",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Calculate 50/50 total using bundle pricing
  function calculateFiftyFiftyTotal(qty: number): number {
    const bundles = Math.floor(qty / fiftyFiftyBundleQty);
    const remaining = qty % fiftyFiftyBundleQty;
    return bundles * fiftyFiftyBundlePrice + remaining * fiftyFiftyPricePerTicket;
  }

  // Determine effective per-ticket price for the sale
  function calculateFiftyFiftyEffectivePrice(qty: number): number {
    const total = calculateFiftyFiftyTotal(qty);
    return qty > 0 ? total / qty : fiftyFiftyPricePerTicket;
  }

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
          <DropdownMenuSeparator />
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
              Price per ticket: ${rafflePricePerTicket.toFixed(2)}
            </div>
            <div className="text-lg font-bold">
              Total: ${(quantity * rafflePricePerTicket).toFixed(2)}
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
                  pricePerTicket: rafflePricePerTicket,
                })
              }
              disabled={recordRaffleSale.isPending}
            >
              {recordRaffleSale.isPending ? "Recording..." : "Record Sale"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 50/50 Sale Dialog with Bundle Pricing */}
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
              {/* Quick-select bundle buttons */}
              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(1)}
                  className="flex-1"
                >
                  1 × ${fiftyFiftyPricePerTicket.toFixed(0)}
                </Button>
                <Button
                  type="button"
                  variant={quantity === fiftyFiftyBundleQty ? "default" : "outline"}
                  size="sm"
                  onClick={() => setQuantity(fiftyFiftyBundleQty)}
                  className="flex-1"
                >
                  {fiftyFiftyBundleQty} for ${fiftyFiftyBundlePrice.toFixed(0)}
                </Button>
                <Button
                  type="button"
                  variant={
                    quantity === fiftyFiftyBundleQty * 2 ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setQuantity(fiftyFiftyBundleQty * 2)}
                  className="flex-1"
                >
                  {fiftyFiftyBundleQty * 2} for $
                  {(fiftyFiftyBundlePrice * 2).toFixed(0)}
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">
                ${fiftyFiftyPricePerTicket.toFixed(2)} each |{" "}
                {fiftyFiftyBundleQty} for ${fiftyFiftyBundlePrice.toFixed(2)}
              </div>
              {quantity >= fiftyFiftyBundleQty && (
                <div className="text-xs text-green-600 font-medium">
                  Bundle applied: {Math.floor(quantity / fiftyFiftyBundleQty)}{" "}
                  bundle(s)
                  {quantity % fiftyFiftyBundleQty > 0 &&
                    ` + ${quantity % fiftyFiftyBundleQty} single`}
                </div>
              )}
            </div>
            <div className="text-lg font-bold">
              Total: ${calculateFiftyFiftyTotal(quantity).toFixed(2)}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFiftyFiftyOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                recordFiftyFiftySale.mutate({
                  guestId,
                  quantity,
                  pricePerTicket: calculateFiftyFiftyEffectivePrice(quantity),
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
