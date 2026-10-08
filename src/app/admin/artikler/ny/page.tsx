import { PageHeader, Panel } from "@/components/admin/ui";
import { ArticleForm } from "@/components/admin/article-form";

export const metadata = { title: "Ny artikkel" };

export default function NewArticle() {
  return (
    <div>
      <PageHeader title="Ny artikkel" />
      <Panel>
        <ArticleForm />
      </Panel>
    </div>
  );
}
