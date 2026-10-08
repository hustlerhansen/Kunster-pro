import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader, Empty } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Kunstnerguide" };

export default async function AdminArticles() {
  const supabase = await createClient();
  const { data } = await supabase.from("articles").select("id, title, slug, status, published_at, updated_at").order("updated_at", { ascending: false });
  return (
    <div>
      <PageHeader
        title="Kunstnerguide"
        description="SEO-optimaliserte artikler knyttet til relevante produkter."
        actions={
          <Button asChild>
            <Link href="/admin/artikler/ny">
              <Plus /> Ny artikkel
            </Link>
          </Button>
        }
      />
      <ul className="divide-y rounded-lg border bg-white">
        {data?.map((a) => (
          <li key={a.id} className="flex flex-wrap items-center gap-4 px-4 py-3 text-sm">
            <Link href={`/admin/artikler/${a.id}`} className="flex-1 font-medium hover:underline">
              {a.title}
            </Link>
            <Badge variant={a.status === "published" ? "success" : "outline"}>{a.status === "published" ? "Publisert" : "Utkast"}</Badge>
            <span className="text-muted-foreground">Oppdatert {formatDate(a.updated_at)}</span>
            {a.status === "published" && (
              <Link href={`/kunstnerguide/${a.slug}`} target="_blank" className="underline">
                Vis
              </Link>
            )}
          </li>
        ))}
        {!data?.length && <Empty>Ingen artikler.</Empty>}
      </ul>
    </div>
  );
}
