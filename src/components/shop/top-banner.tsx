import Link from "next/link";
import { getSettings } from "@/lib/data/catalog";
import { BANNER_ICONS } from "./icons";

export async function TopBanner() {
  const settings = await getSettings();
  const items = settings.banner.items.slice(0, 5);
  return (
    <div className="bg-ink text-white">
      <div className="container-page flex h-10 items-center justify-center gap-6 overflow-hidden text-[0.8rem] lg:justify-between">
        {items.map((item, i) => {
          const Icon = BANNER_ICONS[item.icon] ?? BANNER_ICONS.star;
          const content = (
            <>
              <Icon className="size-4 text-gold" aria-hidden />
              <span>{item.text}</span>
            </>
          );
          const cls = `items-center gap-2 whitespace-nowrap text-white/90 ${i === 0 ? "flex" : i < 3 ? "hidden md:flex" : "hidden lg:flex"}`;
          return item.href ? (
            <Link key={i} href={item.href} className={`${cls} hover:text-gold`}>
              {content}
            </Link>
          ) : (
            <span key={i} className={cls}>
              {content}
            </span>
          );
        })}
      </div>
    </div>
  );
}
