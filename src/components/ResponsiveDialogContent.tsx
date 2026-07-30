"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { DialogPortal, DialogOverlay } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const ResponsiveDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { title: string }
>(({ className, title, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed inset-0 z-50 flex flex-col overflow-hidden border-0 bg-background shadow-lg outline-none",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=open]:duration-200 data-[state=closed]:duration-200",
        "data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom",
        "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:h-[90vh] sm:w-[90vw] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-md sm:border",
        "sm:data-[state=open]:slide-in-from-bottom-0 sm:data-[state=closed]:slide-out-to-bottom-0",
        "sm:data-[state=open]:zoom-in-95 sm:data-[state=closed]:zoom-out-95",
        "sm:data-[state=open]:fade-in-0 sm:data-[state=closed]:fade-out-0",
        className,
      )}
      {...props}
    >
      <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between gap-2 border-b bg-background px-4 py-3">
        <div className="min-w-0 flex-1 truncate text-sm font-semibold">{title}</div>
        <DialogPrimitive.Close className="shrink-0 cursor-pointer rounded-md p-1.5 text-muted-foreground opacity-70 transition-opacity hover:bg-muted hover:text-foreground hover:opacity-100">
          <X className="h-4 w-4" />
          <span className="sr-only">Tutup</span>
        </DialogPrimitive.Close>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto">{children}</div>
    </DialogPrimitive.Content>
  </DialogPortal>
));
ResponsiveDialogContent.displayName = "ResponsiveDialogContent";
