import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Kjør på alle sider unntatt statiske filer, bilder og webhooks
    "/((?!_next/static|_next/image|favicon.ico|images/|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|txt|xml)$).*)",
  ],
};
