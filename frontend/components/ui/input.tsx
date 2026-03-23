"use client";

import * as React from "react";
import { cn } from "../../lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn("rounded-xl bg-black/30 p-3 text-sm text-white", className)}
      {...props}
    />
  )
);
Input.displayName = "Input";
