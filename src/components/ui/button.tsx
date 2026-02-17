import * as React from "react";
import { Slot } from "@radix-ui/react-slot@1.1.2";
import { cva, type VariantProps } from "class-variance-authority@0.7.1";

import { cn } from "./utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm dark:bg-indigo-500 dark:hover:bg-indigo-600 focus-visible:ring-indigo-500/50",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 shadow-sm focus-visible:ring-red-500/20 dark:focus-visible:ring-red-500/40 dark:bg-red-500 dark:hover:bg-red-600",
        outline:
          "border border-slate-300 bg-white text-slate-700 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 shadow-sm dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-indigo-900/20 dark:hover:border-indigo-700 dark:hover:text-indigo-300",
        secondary:
          "bg-slate-100 text-slate-700 hover:bg-slate-200 shadow-sm dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600",
        ghost:
          "hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-300",
        link: "text-indigo-600 underline-offset-4 hover:underline dark:text-indigo-400",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
