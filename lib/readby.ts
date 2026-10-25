import { createReadby } from "readby/next";

// Agent analytics: records which AI Agents read StockOne and what they got.
// Dashboard at /agents (token in READBY_DASHBOARD_TOKEN), data in DATABASE_URL.
export const readby = createReadby();
