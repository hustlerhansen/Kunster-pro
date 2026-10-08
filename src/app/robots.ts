import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const isProduction = process.env.VERCEL_ENV ? process.env.VERCEL_ENV === "production" : true;
  return {
    rules: isProduction
      ? [{ userAgent: "*", allow: "/", disallow: ["/admin", "/konto", "/kasse", "/handlekurv", "/api/", "/auth/", "/sok", "/logg-inn", "/registrer"] }]
      : [{ userAgent: "*", disallow: "/" }],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
