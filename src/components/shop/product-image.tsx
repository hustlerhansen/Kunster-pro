import Image from "next/image";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Produktbilde med next/image. SVG-illustrasjoner (plassholdere) vises uoptimert.
 */
export function ProductImage({
  src,
  alt,
  className,
  sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw",
  priority = false,
  fit = "contain",
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  fit?: "contain" | "cover";
}) {
  if (!src) {
    return (
      <div className={cn("flex items-center justify-center bg-secondary text-muted-foreground", className)}>
        <ImageOff className="size-8" aria-hidden />
        <span className="sr-only">Bilde mangler</span>
      </div>
    );
  }
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        unoptimized={src.endsWith(".svg")}
        className={cn(fit === "contain" ? "object-contain" : "object-cover")}
      />
    </div>
  );
}
