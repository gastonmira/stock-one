import { NextResponse } from "next/server";
import { getMarket } from "@/lib/sources";

export const revalidate = 60;

export async function GET() {
  const data = await getMarket();
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
    },
  });
}
