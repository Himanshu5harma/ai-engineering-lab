/** shadcn/ui Button pattern, adapted to this application's semantic CSS tokens. */
import type { ComponentProps } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";
const buttonVariants = cva("ui-button button", {
  variants: {
    variant: {
      default: "ui-button-primary primary",
      outline: "ui-button-outline",
      secondary: "ui-button-secondary",
      ghost: "ui-button-ghost",
      destructive: "ui-button-destructive",
    },
    size: {
      default: "",
      sm: "ui-button-sm small",
      icon: "ui-button-icon icon-button",
    },
  },
  defaultVariants: { variant: "outline", size: "default" },
});
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
