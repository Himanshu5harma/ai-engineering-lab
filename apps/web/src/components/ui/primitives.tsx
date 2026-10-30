/** Locally owned shadcn/ui form, feedback and surface primitives. */
import type { ComponentProps, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";
export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input data-slot="input" className={cn("ui-input", className)} {...props} />
  );
}
export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn("ui-textarea", className)}
      {...props}
    />
  );
}
export function Select({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      data-slot="native-select"
      className={cn("ui-input", className)}
      {...props}
    />
  );
}
export function Label({ className, ...props }: ComponentProps<"label">) {
  return <label className={cn("ui-label", className)} {...props} />;
}
export function Card({ className, ...props }: ComponentProps<"section">) {
  return (
    <section data-slot="card" className={cn("ui-card", className)} {...props} />
  );
}
const badgeVariants = cva("ui-badge", {
  variants: {
    variant: {
      secondary: "",
      success: "ui-badge-success",
      warning: "ui-badge-warning",
      destructive: "ui-badge-danger",
    },
  },
  defaultVariants: { variant: "secondary" },
});
export function Badge({
  className,
  variant,
  ...props
}: ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
export function StatusIndicator({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning";
}) {
  return (
    <span className={`ui-status ui-status-${tone}`} role="status">
      <i aria-hidden="true" />
      {children}
    </span>
  );
}
export function Alert({
  className,
  variant = "default",
  ...props
}: ComponentProps<"div"> & { variant?: "default" | "destructive" }) {
  return (
    <div
      role={variant === "destructive" ? "alert" : "status"}
      className={cn(
        "ui-alert",
        variant === "destructive" && "ui-alert-danger",
        className,
      )}
      {...props}
    />
  );
}
