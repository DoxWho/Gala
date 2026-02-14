"use client";

import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils/cn";

interface CheckInToggleProps {
  isCheckedIn: boolean;
  onToggle: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function CheckInToggle({
  isCheckedIn,
  onToggle,
  disabled = false,
  className,
}: CheckInToggleProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Switch
        checked={isCheckedIn}
        onCheckedChange={onToggle}
        disabled={disabled}
        aria-label="Check in guest"
      />
      <span
        className={cn(
          "text-xs font-medium",
          isCheckedIn ? "text-green-600" : "text-muted-foreground"
        )}
      >
        {isCheckedIn ? "Checked In" : "Not Here"}
      </span>
    </div>
  );
}
