import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <Link href="/" aria-label="Kunstner Pro – til forsiden" className={cn("group inline-flex flex-col leading-none", className)}>
      <span className={cn("flex items-baseline font-serif text-[1.65rem] font-bold tracking-tight sm:text-[2rem]", inverted ? "text-white" : "text-ink")}>
        Kunstner
        <span className="mx-[0.12em] inline-block size-[0.32em] translate-y-[-0.28em] rounded-full bg-gold" aria-hidden />
        Pro
        <svg viewBox="0 0 40 60" className="ml-1 h-[1.1em] w-auto -translate-y-1 rotate-12" aria-hidden>
          <path d="M33 2 L38 6 L14 44 L9 41 Z" fill={inverted ? "#fff" : "#111"} />
          <path d="M9 41 L14 44 L13 47 L8 45 Z" fill="#C9CACC" />
          <path d="M8 45 L13 47 Q12 56 3 58 Q7 51 8 45 Z" fill="#D4AF65" />
        </svg>
      </span>
      <span className={cn("mt-1 text-[0.58rem] font-medium tracking-[0.32em] uppercase sm:text-[0.62rem]", inverted ? "text-white/70" : "text-ink/70")}>
        Oljemaling &amp; Kunstmateriell
      </span>
    </Link>
  );
}
