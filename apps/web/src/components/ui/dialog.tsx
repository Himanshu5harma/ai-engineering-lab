import * as DialogPrimitive from "@radix-ui/react-dialog";
import type { ComponentProps, ReactNode } from "react";
import { X } from "lucide-react";
import { IconButton } from "./button";
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export function DialogContent({
  children,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="ui-dialog-overlay" />
      <DialogPrimitive.Content className="ui-dialog-content" {...props}>
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
      <DialogPrimitive.Title>{title}</DialogPrimitive.Title>
      <DialogPrimitive.Description>{description}</DialogPrimitive.Description>
    </div>
  );
}
