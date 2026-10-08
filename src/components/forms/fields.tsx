"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import type { ActionState } from "@/app/actions/types";

export function Field({
  label,
  name,
  error,
  hint,
  className,
  ...props
}: React.ComponentProps<"input"> & { label: string; name: string; error?: string; hint?: string }) {
  const id = props.id ?? `f-${name}`;
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>
        {label}
        {props.required && <span className="text-destructive">*</span>}
      </Label>
      <Input id={id} name={name} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-err` : undefined} {...props} />
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && (
        <p id={`${id}-err`} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export function SubmitButton({ children, pendingText = "Lagrer …", className, ...props }: React.ComponentProps<typeof Button> & { pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || props.disabled} className={className} {...props}>
      {pending ? pendingText : children}
    </Button>
  );
}

export function FormMessage({ state }: { state: ActionState }) {
  if (!state.message) return null;
  return (
    <Alert variant={state.ok ? "success" : "destructive"} role={state.ok ? "status" : "alert"}>
      {state.message}
    </Alert>
  );
}

export const initialState: ActionState = { ok: false, message: "" };
