import { MetadataRoute } from "next";
import { appConfig } from "@/lib/config";
import { isStoreSetupMode } from "@/lib/config.server";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = appConfig.siteUrl || "";

  if (isStoreSetupMode()) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
      host: baseUrl,
    };
  }

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
