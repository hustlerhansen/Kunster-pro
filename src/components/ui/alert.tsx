import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva("relative w-full rounded-lg border px-4 py-3 text-sm [&>svg]:absolute [&>svg]:top-3.5 [&>svg]:left-4 [&>svg]:size-4 [&>svg~*]:pl-7", {
  variants: {
    variant: {
      default: "bg-white text-foreground",
      info: "border-sky-200 bg-sky-50 text-sky-900",
      warning: "border-amber-200 bg-amber-50 text-amber-900",
      destructive: "border-red-200 bg-red-50 text-red-800",
      success: "border-emerald-200 bg-emerald-50 text-emerald-900",
      gold: "border-gold/50 bg-gold-light/60 text-ink",
    },
  },
  defaultVariants: { variant: "default" },
});

function Alert({ className, variant, ...props }: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return <div data-slot="alert" role="alert" className={cn(alertVariants({ variant }), className)} {...props} />;
}
function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="alert-title" className={cn("mb-1 font-semibold", className)} {...props} />;
}
function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="alert-description" className={cn("text-sm [&_p]:leading-relaxed", className)} {...props} />;
}

export { Alert, AlertTitle, AlertDescription };
