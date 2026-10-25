import { createReadby } from "readby/next";

// Agent analytics: records which AI Agents read StockOne and what they got.
// Dashboard at /agents (token in READBY_DASHBOARD_TOKEN), data in DATABASE_URL.
// Only production records: Neon shares DATABASE_URL with previews and local dev, and
// their Visits would mix into production's data. An empty URL turns recording off.
export const readby = createReadby({
  databaseUrl: process.env.VERCEL_ENV === "production" ? process.env.DATABASE_URL : "",
  excludePaths: ["/api", "/opengraph-image", "/twitter-image"],
});
