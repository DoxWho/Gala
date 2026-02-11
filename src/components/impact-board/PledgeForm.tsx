"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc/client";
import { DONATION_TYPES } from "@/lib/constants";

interface PledgeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  impactBoardItemId: string;
  impactBoardItemTitle: string;
  defaultAmount: number;
  eventId: string;
  guests: Array<{ id: string; firstName: string; lastName: string; party: { partyName: string } }>;
}

export function PledgeForm({
  open,
  onOpenChange,
  impactBoardItemId,
  impactBoardItemTitle,
  defaultAmount,
  eventId,
  guests,
}: PledgeFormProps) {
  const [guestId, setGuestId] = useState("");
  const [amount, setAmount] = useState(defaultAmount.toString());
  const [donationType, setDonationType] = useState<"pre_pledged" | "gala_night">("gala_night");
  const [notes, setNotes] = useState("");

  const utils = trpc.useUtils();
  const createPledge = trpc.pledges.create.useMutation({
    onSuccess: () => {
      utils.impactBoard.getAll.invalidate();
      utils.impactBoard.getById.invalidate({ id: impactBoardItemId });
      utils.dashboard.getStats.invalidate({ eventId });
      onOpenChange(false);
      resetForm();
    },
  });

  function resetForm() {
    setGuestId("");
    setAmount(defaultAmount.toString());
    setDonationType("gala_night");
    setNotes("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!guestId || !amount) return;

    createPledge.mutate({
      guestId,
      impactBoardItemId,
      amount: parseFloat(amount),
      donationType,
      notes: notes || undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Pledge</DialogTitle>
            <DialogDescription>
              {impactBoardItemTitle}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Guest</Label>
              <Select value={guestId} onValueChange={setGuestId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select guest..." />
                </SelectTrigger>
                <SelectContent>
                  {guests.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.firstName} {g.lastName} ({g.party.partyName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Donation Type</Label>
              <Select
                value={donationType}
                onValueChange={(v) => setDonationType(v as "pre_pledged" | "gala_night")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DONATION_TYPES.map((dt) => (
                    <SelectItem key={dt.value} value={dt.value}>
                      {dt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add a note..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createPledge.isPending || !guestId || !amount}
            >
              {createPledge.isPending ? "Adding..." : "Add Pledge"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
