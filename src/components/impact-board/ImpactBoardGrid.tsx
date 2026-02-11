"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { ImpactBoardItemCard } from "./ImpactBoardItem";
import { ImpactBoardFilters } from "./ImpactBoardFilters";
import { PledgeForm } from "./PledgeForm";
import { PledgeList } from "./PledgeList";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils/formatting";
import { IMPACT_CATEGORIES } from "@/lib/constants";
import { Plus } from "lucide-react";
import type { ImpactCategory } from "@/types";

interface ImpactBoardGridProps {
  eventId: string;
}

export function ImpactBoardGrid({ eventId }: ImpactBoardGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showNoPledges, setShowNoPledges] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [pledgeFormOpen, setPledgeFormOpen] = useState(false);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemCategory, setNewItemCategory] = useState<ImpactCategory>("wishlist");
  const [newItemAmount, setNewItemAmount] = useState("");

  const { data: items, isLoading } = trpc.impactBoard.getAll.useQuery(
    {
      eventId,
      category: selectedCategory as ImpactCategory | undefined,
      hasNoPledges: showNoPledges || undefined,
    },
    { refetchInterval: 15000 }
  );

  const { data: selectedItem } = trpc.impactBoard.getById.useQuery(
    { id: selectedItemId! },
    { enabled: !!selectedItemId }
  );

  const { data: guests } = trpc.guests.getAll.useQuery({
    eventId,
  });

  const utils = trpc.useUtils();
  const createItem = trpc.impactBoard.create.useMutation({
    onSuccess: () => {
      utils.impactBoard.getAll.invalidate();
      setAddItemOpen(false);
      setNewItemTitle("");
      setNewItemAmount("");
    },
  });

  if (isLoading) {
    return <LoadingSpinner text="Loading impact board..." className="py-12" />;
  }

  const guestList = guests?.map((g) => ({
    id: g.id,
    firstName: g.firstName,
    lastName: g.lastName,
    party: g.party,
  })) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">Impact Board</h2>
        <Button size="sm" className="gap-2" onClick={() => setAddItemOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>

      <ImpactBoardFilters
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        showNoPledges={showNoPledges}
        onShowNoPledgesChange={setShowNoPledges}
      />

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {items?.map((item) => (
          <ImpactBoardItemCard
            key={item.id}
            item={item}
            onClick={(id) => setSelectedItemId(id)}
          />
        ))}
      </div>

      {items?.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No impact board items found
        </div>
      )}

      {/* Item Detail Dialog */}
      <Dialog
        open={!!selectedItemId}
        onOpenChange={(open) => !open && setSelectedItemId(null)}
      >
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedItem?.title}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Default: {formatCurrency(parseFloat(selectedItem.defaultAmount))}
                </span>
                <span className="font-bold">
                  Total: {formatCurrency(selectedItem.totalPledged)}
                </span>
              </div>

              <Button
                className="w-full"
                onClick={() => setPledgeFormOpen(true)}
              >
                Add Pledge
              </Button>

              <PledgeList
                pledges={selectedItem.pledges}
                impactBoardItemId={selectedItem.id}
                eventId={eventId}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Pledge Form Dialog */}
      {selectedItem && (
        <PledgeForm
          open={pledgeFormOpen}
          onOpenChange={setPledgeFormOpen}
          impactBoardItemId={selectedItem.id}
          impactBoardItemTitle={selectedItem.title}
          defaultAmount={parseFloat(selectedItem.defaultAmount)}
          eventId={eventId}
          guests={guestList}
        />
      )}

      {/* Add Item Dialog */}
      <Dialog open={addItemOpen} onOpenChange={setAddItemOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Impact Board Item</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e.target.value)}
                placeholder="Item title"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={newItemCategory}
                onValueChange={(v) => setNewItemCategory(v as ImpactCategory)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IMPACT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Default Amount</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={newItemAmount}
                onChange={(e) => setNewItemAmount(e.target.value)}
                placeholder="500.00"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAddItemOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                createItem.mutate({
                  eventId,
                  category: newItemCategory,
                  title: newItemTitle,
                  defaultAmount: parseFloat(newItemAmount),
                })
              }
              disabled={
                createItem.isPending ||
                !newItemTitle ||
                !newItemAmount
              }
            >
              {createItem.isPending ? "Adding..." : "Add Item"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
