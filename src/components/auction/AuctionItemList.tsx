"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { AuctionItemCard } from "./AuctionItemCard";
import { WinnerAssignment } from "./WinnerAssignment";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils/formatting";
import { Plus } from "lucide-react";
import type { AuctionItemWithWinner } from "@/types";

interface AuctionItemListProps {
  eventId: string;
}

export function AuctionItemList({ eventId }: AuctionItemListProps) {
  const [selectedItem, setSelectedItem] = useState<AuctionItemWithWinner | null>(null);
  const [winnerOpen, setWinnerOpen] = useState(false);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newEstimatedValue, setNewEstimatedValue] = useState("");

  const { data: items, isLoading } = trpc.auction.getAll.useQuery(
    { eventId },
    { refetchInterval: 15000 }
  );

  const { data: revenue } = trpc.auction.getTotalRevenue.useQuery(
    { eventId },
    { refetchInterval: 10000 }
  );

  const { data: parties } = trpc.parties.getAll.useQuery({ eventId });

  const utils = trpc.useUtils();
  const createItem = trpc.auction.create.useMutation({
    onSuccess: () => {
      utils.auction.getAll.invalidate({ eventId });
      setAddItemOpen(false);
      setNewTitle("");
      setNewDescription("");
      setNewEstimatedValue("");
    },
  });

  if (isLoading) {
    return <LoadingSpinner text="Loading auction items..." className="py-12" />;
  }

  const partyList = parties?.map((p) => ({
    id: p.id,
    partyName: p.partyName,
  })) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Auction Items</h2>
          {revenue && (
            <Badge variant="outline">
              {revenue.soldCount}/{revenue.totalItems} sold |{" "}
              {formatCurrency(revenue.total)}
            </Badge>
          )}
        </div>
        <Button size="sm" className="gap-2" onClick={() => setAddItemOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {items?.map((item) => (
          <AuctionItemCard
            key={item.id}
            item={item as AuctionItemWithWinner}
            onAssignWinner={(item) => {
              setSelectedItem(item);
              setWinnerOpen(true);
            }}
          />
        ))}
      </div>

      {items?.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No auction items yet
        </div>
      )}

      <WinnerAssignment
        open={winnerOpen}
        onOpenChange={setWinnerOpen}
        item={selectedItem}
        parties={partyList}
        eventId={eventId}
      />

      {/* Add Item Dialog */}
      <Dialog open={addItemOpen} onOpenChange={setAddItemOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Auction Item</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Item title"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Item description (optional)"
              />
            </div>
            <div className="space-y-2">
              <Label>Estimated Value</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={newEstimatedValue}
                onChange={(e) => setNewEstimatedValue(e.target.value)}
                placeholder="0.00 (optional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddItemOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                createItem.mutate({
                  eventId,
                  title: newTitle,
                  description: newDescription || undefined,
                  estimatedValue: newEstimatedValue
                    ? parseFloat(newEstimatedValue)
                    : undefined,
                })
              }
              disabled={createItem.isPending || !newTitle}
            >
              {createItem.isPending ? "Adding..." : "Add Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
