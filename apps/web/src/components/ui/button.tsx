/** shadcn/ui new-york Button, adapted to the Lab component API. See README.md. */
import type { ComponentProps } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";
const buttonVariants = cva(
  "ui-button button inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-solid border-transparent text-sm font-medium whitespace-nowrap transition-[color,background-color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "primary bg-primary text-primary-foreground hover:bg-primary/90",
        outline:
          "border-input bg-card text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/20 dark:hover:bg-input/40",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 dark:bg-destructive/60",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "small h-8 gap-1.5 px-3 text-xs",
        icon: "icon-button size-9 p-0",
      },
    },
    defaultVariants: { variant: "outline", size: "default" },
  },
);
export function Button({
  className,
  variant,
  size,
  asChild = false,
  type = "button",
  ...props
}: ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      data-variant={variant || "outline"}
      data-size={size || "default"}
      type={asChild ? undefined : type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
export function IconButton(
  props: ComponentProps<typeof Button> & { "aria-label": string },
) {
  return <Button size="icon" variant="ghost" {...props} />;
}
