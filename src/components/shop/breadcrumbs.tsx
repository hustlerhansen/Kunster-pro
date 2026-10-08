import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { absoluteUrl } from "@/lib/utils";
import { JsonLd } from "./json-ld";

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  const all = [{ label: "Forside", href: "/" }, ...items];
  return (
    <>
      <nav aria-label="Brødsmuler" className="text-xs text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1">
          {all.map((item, i) => (
            <li key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="size-3" aria-hidden />}
              {item.href && i < all.length - 1 ? (
                <Link href={item.href} className="hover:text-foreground hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={i === all.length - 1 ? "page" : undefined} className="text-foreground">
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: all.map((item, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: item.label,
            ...(item.href ? { item: absoluteUrl(item.href) } : {}),
          })),
        }}
      />
    </>
  );
}
