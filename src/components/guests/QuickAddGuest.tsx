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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

interface QuickAddGuestProps {
  eventId: string;
  parties: Array<{ id: string; partyName: string }>;
}

export function QuickAddGuest({ eventId, parties }: QuickAddGuestProps) {
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [partyId, setPartyId] = useState("");
  const [newPartyName, setNewPartyName] = useState("");
  const [isWalkIn, setIsWalkIn] = useState(false);
  const [isPlusOne, setIsPlusOne] = useState(false);
  const [createNewParty, setCreateNewParty] = useState(false);

  const utils = trpc.useUtils();
  const createParty = trpc.parties.create.useMutation();
  const createGuest = trpc.guests.create.useMutation({
    onSuccess: () => {
      utils.guests.getAll.invalidate();
      utils.guests.getAttendanceStats.invalidate();
      setOpen(false);
      resetForm();
    },
  });

  function resetForm() {
    setFirstName("");
    setLastName("");
    setPartyId("");
    setNewPartyName("");
    setIsWalkIn(false);
    setIsPlusOne(false);
    setCreateNewParty(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    let finalPartyId = partyId;
    
    if (createNewParty && newPartyName) {
      const newParty = await createParty.mutateAsync({
        eventId,
        partyName: newPartyName,
      });
      finalPartyId = newParty.id;
    }

    if (!finalPartyId || !firstName || !lastName) return;

    createGuest.mutate({
      partyId: finalPartyId,
      firstName,
      lastName,
      isWalkIn,
      isPlusOne,
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Guest</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Guest</DialogTitle>
            <DialogDescription>
              Quick add a walk-in or plus-one guest
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="createNewParty"
                checked={createNewParty}
                onCheckedChange={(checked) =>
                  setCreateNewParty(checked === true)
                }
              />
              <Label htmlFor="createNewParty">Create new party</Label>
            </div>

            {createNewParty ? (
              <div className="space-y-2">
                <Label htmlFor="newPartyName">New Party Name</Label>
                <Input
                  id="newPartyName"
                  value={newPartyName}
                  onChange={(e) => setNewPartyName(e.target.value)}
                  placeholder="e.g., Smith Family"
                  required
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Select Party</Label>
                <Select value={partyId} onValueChange={setPartyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a party..." />
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
            )}

            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isWalkIn"
                  checked={isWalkIn}
                  onCheckedChange={(checked) => setIsWalkIn(checked === true)}
                />
                <Label htmlFor="isWalkIn">Walk-in</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPlusOne"
                  checked={isPlusOne}
                  onCheckedChange={(checked) => setIsPlusOne(checked === true)}
                />
                <Label htmlFor="isPlusOne">Plus One</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                createGuest.isPending ||
                createParty.isPending ||
                !firstName ||
                !lastName ||
                (!partyId && !createNewParty) ||
                (createNewParty && !newPartyName)
              }
            >
              {createGuest.isPending ? "Adding..." : "Add Guest"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
