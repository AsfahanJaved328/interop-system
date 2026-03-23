"use client";

import * as React from "react";
import { cn } from "../../lib/utils";

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn("rounded-xl bg-[#4F46E5] px-4 py-2 text-sm font-semibold text-white", className)}
    {...props}
  />
));
Button.displayName = "Button";
