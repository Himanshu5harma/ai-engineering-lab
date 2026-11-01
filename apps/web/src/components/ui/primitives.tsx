/** shadcn/ui new-york controls, adapted to existing semantic elements and statuses. */
import type { ComponentProps, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";
const fieldClasses =
  "w-full min-w-0 rounded-md border border-solid border-input bg-transparent px-3 py-2 text-sm text-foreground shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/20";
export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      data-slot="input"
      className={cn("ui-input h-9", fieldClasses, className)}
      {...props}
    />
  );
}
export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "ui-textarea min-h-24 resize-y leading-relaxed",
        fieldClasses,
        className,
      )}
      {...props}
    />
  );
}
export function Select({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      data-slot="native-select"
      className={cn("ui-input h-9", fieldClasses, className)}
      {...props}
    />
  );
}
export function Label({ className, ...props }: ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "ui-label block text-xs leading-normal font-medium",
        className,
      )}
      {...props}
    />
  );
}
export function Card({ className, ...props }: ComponentProps<"section">) {
  return (
    <section
      data-slot="card"
      className={cn(
        "ui-card rounded-xl border border-solid border-border bg-card text-card-foreground shadow-xs",
        className,
      )}
      {...props}
    />
  );
}
const badgeVariants = cva(
  "ui-badge inline-flex w-fit shrink-0 items-center justify-center gap-1 rounded-full border border-solid border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap",
  {
    variants: {
      variant: {
        secondary: "bg-secondary text-secondary-foreground",
        success: "bg-[var(--success-soft)] text-[var(--success)]",
        warning: "bg-[var(--warning-soft)] text-[var(--gold)]",
        destructive: "bg-[var(--danger-soft)] text-[var(--danger)]",
      },
    },
    defaultVariants: { variant: "secondary" },
  },
);
export function Badge({
  className,
  variant,
  ...props
}: ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
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
      data-slot="alert"
      role={variant === "destructive" ? "alert" : "status"}
      className={cn(
        "ui-alert flex items-center gap-2.5 rounded-lg border border-solid border-border bg-card px-4 py-3 text-sm leading-relaxed text-card-foreground",
        variant === "destructive" &&
          "border-destructive/30 bg-[var(--danger-soft)] text-[var(--danger)]",
        className,
      )}
      {...props}
    />
  );
}
