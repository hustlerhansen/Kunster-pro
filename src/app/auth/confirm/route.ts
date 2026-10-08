import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

const TYPES: EmailOtpType[] = ["signup", "recovery", "invite", "email_change", "email", "magiclink"];

/** Verifiserer token_hash fra e-postlenker (bl.a. passordtilbakestilling via Resend). */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const nextParam = url.searchParams.get("neste");
  const next = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/konto";
  if (tokenHash && type && TYPES.includes(type) && isSupabaseConfigured()) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }
  return NextResponse.redirect(new URL("/logg-inn?feil=lenke", url.origin));
}
