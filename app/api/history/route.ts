import { NextResponse } from "next/server";
import { getHistory, type HistoryRange } from "@/lib/sources";

export const revalidate = 300;

const VALID: HistoryRange[] = ["1M", "6M", "1A", "5A"];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = (searchParams.get("symbol") ?? "").trim().toUpperCase();
  const rangeParam = (searchParams.get("range") ?? "6M") as HistoryRange;
  const isIndex = searchParams.get("index") === "1";
  const range = VALID.includes(rangeParam) ? rangeParam : "6M";

  if (!symbol) return NextResponse.json({ t: [], c: [] });

  const data = await getHistory(symbol, range, isIndex);
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
