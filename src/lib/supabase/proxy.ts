import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/env";

/**
 * Fornyer Supabase-sesjonen og beskytter /konto og /admin.
 * Rolle-sjekk for /admin gjøres i tillegg server-side i admin-layout og i hver handling.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!isSupabaseConfigured()) {
    // Demomodus: kontosider krever database – send til innlogging (som viser forklaring)
    return request.nextUrl.pathname.startsWith("/konto") ? redirectToLogin(request) : response;
  }

  const path = request.nextUrl.pathname;
  const needsAuth = path.startsWith("/konto") || path.startsWith("/admin");
  const hasSessionCookie = request.cookies.getAll().some((c) => c.name.startsWith("sb-") && c.name.includes("auth-token"));

  // Ingen sesjon: unngå unødvendig nettverkskall mot Supabase (rask lastetid)
  if (!hasSessionCookie) {
    return needsAuth ? redirectToLogin(request) : response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (needsAuth && !user) return redirectToLogin(request);
  return response;
}

function redirectToLogin(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/logg-inn";
  url.search = `?neste=${encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search)}`;
  return NextResponse.redirect(url);
}
