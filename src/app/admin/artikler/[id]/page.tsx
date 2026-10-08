import { notFound } from "next/navigation";
import { PageHeader, Panel } from "@/components/admin/ui";
import { ArticleForm } from "@/components/admin/article-form";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { deleteArticle } from "../../_actions/content";
import type { Article } from "@/lib/types";

export const metadata = { title: "Rediger artikkel" };

export default async function EditArticle({ params }: PageProps<"/admin/artikler/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const { data } = await supabase.from("articles").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  return (
    <div>
      <PageHeader
        title={data.title}
        actions={
          <form action={deleteArticle}>
            <input type="hidden" name="id" value={data.id} />
            <Button variant="outline" size="sm" className="text-destructive">
              Slett
            </Button>
          </form>
        }
      />
      <Panel>
        <ArticleForm a={data as Article} />
      </Panel>
    </div>
  );
}
