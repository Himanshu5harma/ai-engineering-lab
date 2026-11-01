import * as DialogPrimitive from "@radix-ui/react-dialog";
import type { ComponentProps, ReactNode } from "react";
import { X } from "lucide-react";
import { IconButton } from "./button";
import { cn } from "../../lib/utils";
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export function DialogContent({
  children,
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="ui-dialog-overlay fixed inset-0 z-[1000] bg-black/50" />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "ui-dialog-content fixed top-1/2 left-1/2 z-[1001] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-solid border-border bg-popover p-6 text-popover-foreground shadow-lg outline-none",
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close asChild>
          <IconButton aria-label="Close dialog" className="ui-dialog-close">
            <X size={16} />
          </IconButton>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
export function DialogHeader({
  title,
  description,
}: {
  title: string;
  description: ReactNode;
}) {
  return (
    <div className="ui-dialog-header">
      <DialogPrimitive.Title className="text-lg leading-tight font-semibold">
        {title}
      </DialogPrimitive.Title>
      <DialogPrimitive.Description className="text-sm leading-relaxed text-muted-foreground">
        {description}
      </DialogPrimitive.Description>
    </div>
  );
}
