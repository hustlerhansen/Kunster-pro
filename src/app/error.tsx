"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="container-page py-24 text-center">
      <h1 className="text-3xl font-semibold">Noe gikk galt</h1>
      <p className="mt-3 text-muted-foreground">Vi beklager. Prøv igjen, eller kontakt kundeservice hvis feilen vedvarer.</p>
      {error.digest && <p className="mt-2 text-xs text-muted-foreground">Feilkode: {error.digest}</p>}
      <Button className="mt-6" onClick={reset}>
        Prøv igjen
      </Button>
    </main>
  );
}
