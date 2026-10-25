import { NextResponse, type NextRequest } from "next/server";
import { readby } from "@/lib/readby";

export function proxy(request: NextRequest) {
  readby.proxy(request);
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|agents(?:/|$)|.*\\.(?:png|jpe?g|gif|webp|avif|svg|ico|bmp|woff2?|ttf|otf|eot|mp4|webm|mp3|wav|ogg)$).*)"],
};
