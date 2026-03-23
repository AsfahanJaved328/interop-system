"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "../../lib/utils";

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      className={cn("rounded-xl border border-white/10 bg-black/90 p-3 text-sm", className)}
      {...props}
    />
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = "PopoverContent";
