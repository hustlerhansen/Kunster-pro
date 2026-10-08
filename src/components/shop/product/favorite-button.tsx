"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { toggleFavorite } from "@/app/actions/account";
import { cn } from "@/lib/utils";

export function FavoriteButton({ productId }: { productId: string }) {
  const [fav, setFav] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const { data: row } = await supabase.from("favorites").select("product_id").eq("product_id", productId).maybeSingle();
      setFav(Boolean(row));
    });
  }, [productId]);

  return (
    <button
      type="button"
      aria-pressed={fav}
      aria-label={fav ? "Fjern fra favoritter" : "Legg til i favoritter"}
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await toggleFavorite(productId);
          if (res.requiresLogin) {
            toast.info("Logg inn for å lagre favoritter.");
            router.push(`/logg-inn?neste=${encodeURIComponent(window.location.pathname)}`);
            return;
          }
          if (!res.ok) {
            toast.error(res.message);
            return;
          }
          setFav(res.favorite);
          toast.success(res.favorite ? "Lagt til i favoritter" : "Fjernet fra favoritter");
        })
      }
      className="flex size-12 shrink-0 items-center justify-center rounded-md border border-input bg-white transition-colors hover:border-ink"
    >
      <Heart className={cn("size-5", fav && "fill-destructive text-destructive")} />
    </button>
  );
}
