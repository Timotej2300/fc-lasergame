"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { cx } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";
type Size = "md" | "lg" | "xl";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-accent hover:bg-accent/90 text-white shadow-lg shadow-accent/25",
  secondary: "bg-panel2 hover:bg-panel2/80 text-white border border-white/10",
  ghost: "bg-transparent hover:bg-white/5 text-white border border-white/15",
  danger: "bg-danger hover:bg-danger/90 text-white",
  success: "bg-ok hover:bg-ok/90 text-white"
};

const sizeClasses: Record<Size, string> = {
  md: "px-5 py-2.5 text-sm rounded-xl",
  lg: "px-7 py-4 text-lg rounded-2xl",
  xl: "px-10 py-6 text-2xl rounded-3xl"
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", size = "md", className, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={cx(
        "font-display font-bold tracking-wide transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:pointer-events-none",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
});
