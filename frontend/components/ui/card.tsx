"use client";

import * as React from "react";
import { cn } from "../../lib/utils";

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("rounded-2xl bg-white/5 p-6 backdrop-blur", className)} {...props} />
  )
);
Card.displayName = "Card";
