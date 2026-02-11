"use client";

import { Button } from "@/components/ui/button";
import { IMPACT_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";

interface ImpactBoardFiltersProps {
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  showNoPledges: boolean;
  onShowNoPledgesChange: (show: boolean) => void;
}

export function ImpactBoardFilters({
  selectedCategory,
  onCategoryChange,
  showNoPledges,
  onShowNoPledgesChange,
}: ImpactBoardFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={selectedCategory === null ? "default" : "outline"}
        size="sm"
        onClick={() => onCategoryChange(null)}
      >
        All
      </Button>
      {IMPACT_CATEGORIES.map((cat) => (
        <Button
          key={cat.value}
          variant={selectedCategory === cat.value ? "default" : "outline"}
          size="sm"
          onClick={() => onCategoryChange(cat.value)}
        >
          {cat.label}
        </Button>
      ))}
      <Button
        variant={showNoPledges ? "default" : "outline"}
        size="sm"
        onClick={() => onShowNoPledgesChange(!showNoPledges)}
        className={cn(showNoPledges && "bg-orange-500 hover:bg-orange-600")}
      >
        No Pledges
      </Button>
    </div>
  );
}
