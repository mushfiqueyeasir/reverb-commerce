import { MetadataRoute } from "next";
import { appConfig } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = appConfig.siteUrl || "";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/cart", "/checkout"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
