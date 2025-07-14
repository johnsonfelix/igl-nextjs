"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "./utils";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

export const Sheet = Dialog.Root;
export const SheetTrigger = Dialog.Trigger;

export const SheetContent = React.forwardRef<
  React.ElementRef<typeof Dialog.Content>,
  React.ComponentPropsWithoutRef<typeof Dialog.Content> & { side?: "left" | "right" | "top" | "bottom"; title?: string }
>(({ children, className, side = "right", title = "Sheet", ...props }, ref) => {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 bg-black/30 z-50" />
      <Dialog.Content
        ref={ref}
        className={cn(
          "fixed z-50 bg-white shadow-lg transition-transform",
          side === "right" && "top-0 right-0 h-full w-full max-w-sm",
          side === "left" && "top-0 left-0 h-full w-full max-w-sm",
          side === "top" && "top-0 left-0 w-full max-h-[90vh]",
          side === "bottom" && "bottom-0 left-0 w-full max-h-[90vh]",
          className
        )}
        {...props}
      >
        <Dialog.Title asChild>
          <VisuallyHidden>{title}</VisuallyHidden>
        </Dialog.Title>

        <div className="p-4 flex justify-end">
          <Dialog.Close>
            <X className="h-5 w-5 text-gray-600 hover:text-gray-800 cursor-pointer" />
          </Dialog.Close>
        </div>
        <div className="px-4 pb-4 overflow-y-auto max-h-[85vh]">{children}</div>
      </Dialog.Content>
    </Dialog.Portal>
  );
});
SheetContent.displayName = "SheetContent";
