import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role: "customer" | "staff" | "admin";
  customer_type: "private" | "business";
  company_id: string | null;
  marketing_consent: boolean;
  marketing_consent_at: string | null;
  is_blocked: boolean;
  created_at: string;
}

export interface Company {
  id: string;
  name: string;
  org_number: string;
  customer_category: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  billing_address: Record<string, string> | null;
  delivery_address: Record<string, string> | null;
  price_group_id: string | null;
  status: "active" | "blocked";
}

/** Gjeldende innlogget bruker (verifisert mot Supabase Auth). Cachet per forespørsel. */
export const getCurrentUser = cache(async () => {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
});

export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return (data as Profile | null) ?? null;
});

export const getCurrentCompany = cache(async (): Promise<Company | null> => {
  const profile = await getCurrentProfile();
  if (!profile?.company_id) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("companies").select("*").eq("id", profile.company_id).maybeSingle();
  return (data as Company | null) ?? null;
});

export async function requireUser(next = "/konto") {
  const user = await getCurrentUser();
  if (!user) redirect(`/logg-inn?neste=${encodeURIComponent(next)}`);
  const profile = await getCurrentProfile();
  if (profile?.is_blocked) redirect("/logg-inn?feil=sperret");
  return { user, profile };
}

export function isStaffRole(role?: string | null) {
  return role === "admin" || role === "staff";
}

/** Krever ansatt (admin/staff). Brukes i admin-layout OG i hver admin-handling. */
export async function requireStaff() {
  const user = await getCurrentUser();
  if (!user) redirect("/logg-inn?neste=/admin");
  const profile = await getCurrentProfile();
  if (!profile || !isStaffRole(profile.role) || profile.is_blocked) redirect("/?feil=ingen-tilgang");
  return { user, profile };
}

export async function requireAdmin() {
  const ctx = await requireStaff();
  if (ctx.profile.role !== "admin") redirect("/admin?feil=krever-administrator");
  return ctx;
}
