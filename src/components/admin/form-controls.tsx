"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ActionState } from "@/app/actions/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { SubmitButton } from "@/components/forms/fields";
import { cn } from "@/lib/utils";

/** Skjema som kjører en server action og viser resultat som toast. */
export function ActionForm({
  action,
  children,
  submitLabel = "Lagre",
  className,
  redirectTo,
  submitVariant,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  submitLabel?: string;
  className?: string;
  redirectTo?: string;
  submitVariant?: "default" | "gold" | "outline" | "destructive";
}) {
  const [state, formAction] = useActionState(action, { ok: false, message: "" });
  const router = useRouter();
  useEffect(() => {
    if (!state.message) return;
    if (state.ok) {
      toast.success(state.message);
      if (redirectTo) router.push(redirectTo);
    } else toast.error(state.message);
  }, [state, redirectTo, router]);
  return (
    <form action={formAction} className={cn("space-y-4", className)}>
      {children}
      {state.fieldErrors && Object.keys(state.fieldErrors).length > 0 && (
        <ul className="rounded-md bg-red-50 p-3 text-xs text-red-700">
          {Object.entries(state.fieldErrors).map(([k, v]) => (
            <li key={k}>
              {k}: {v}
            </li>
          ))}
        </ul>
      )}
      <SubmitButton variant={submitVariant}>{submitLabel}</SubmitButton>
    </form>
  );
}

type Base = { label: string; name: string; hint?: string; className?: string };

export function TextInput({ label, name, hint, className, ...props }: Base & React.ComponentProps<"input">) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={`a-${name}`}>{label}</Label>
      <Input id={`a-${name}`} name={name} {...props} />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function TextArea({ label, name, hint, className, ...props }: Base & React.ComponentProps<"textarea">) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={`a-${name}`}>{label}</Label>
      <Textarea id={`a-${name}`} name={name} {...props} />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Select({ label, name, hint, className, options, ...props }: Base & React.ComponentProps<"select"> & { options: { value: string; label: string }[] }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={`a-${name}`}>{label}</Label>
      <NativeSelect id={`a-${name}`} name={name} {...props}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </NativeSelect>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Check({ label, name, defaultChecked, hint }: { label: string; name: string; defaultChecked?: boolean; hint?: string }) {
  return (
    <label className="flex items-start gap-2 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-0.5 accent-[#111]" />
      <span>
        {label}
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </span>
    </label>
  );
}
