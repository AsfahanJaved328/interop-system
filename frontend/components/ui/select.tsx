"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { cn } from "../../lib/utils";

export const Select = SelectPrimitive.Root;
export const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn("rounded-xl bg-black/30 px-3 py-2 text-sm", className)}
    {...props}
  />
));
SelectTrigger.displayName = "SelectTrigger";

export const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn("rounded-xl border border-white/10 bg-black/90 p-2 text-sm", className)}
      {...props}
    />
  </SelectPrimitive.Portal>
));
SelectContent.displayName = "SelectContent";
