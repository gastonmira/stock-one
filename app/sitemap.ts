import type { MetadataRoute } from "next";

const SITE_URL = "https://stockone-nu.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      changeFrequency: "hourly",
      priority: 1,
    },
  ];
}
