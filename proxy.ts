import { NextResponse, type NextRequest } from "next/server";
import { readby } from "@/lib/readby";

export function proxy(request: NextRequest) {
  readby.proxy(request);
  return NextResponse.next();
}

export const config = {
  matcher: [
    {
      // Pages only: no internals, static files, the readby dashboard, API routes or generated images.
      source:
        "/((?!_next/static|_next/image|favicon.ico|agents(?:/|$)|api(?:/|$)|opengraph-image|twitter-image|.*\\.(?:png|jpe?g|gif|webp|avif|svg|ico|bmp|woff2?|ttf|otf|eot|mp4|webm|mp3|wav|ogg)$).*)",
      // Only user agents that could be in readby's Agent Registry, so human requests skip the proxy
      // and keep being served straight from the CDN. A coarse, case-insensitive superset: readby
      // still decides which of these are Agents. Regenerate when readby adds tokens outside it.
      has: [
        {
          type: "header",
          key: "user-agent",
          value:
            ".*(?:[Bb][Oo][Tt]|[Aa][Gg][Ee][Nn][Tt]|[Uu][Ss][Ee][Rr]|[Cc][Rr][Aa][Ww][Ll]|[Ss][Pp][Ii][Dd][Ee][Rr]|[Ff][Ee][Tt][Cc][Hh]|[Aa][Mm][Aa][Zz][Oo][Nn]|[Aa][Nn][Tt][Hh][Rr][Oo][Pp][Ii][Cc]-[Aa][Ii]|[Cc][Oo][Hh][Ee][Rr][Ee]-[Aa][Ii]|[Bb][Ii][Gg][Ss][Uu][Rr]\\.[Aa][Ii]|[Cc][Ll][Aa][Uu][Dd][Ee]-|[Gg][Oo][Oo][Gg][Ll][Ee]-|[Gg][Oo][Oo][Gg][Ll][Ee][Oo][Tt][Hh][Ee][Rr]|[Gg][Ee][Mm][Ii][Nn][Ii]-|[Mm][Ii][Ss][Tt][Rr][Aa][Ll][Aa][Ii]-|[Mm][Ee][Tt][Aa]-|[Mm][Oo][Zz][Ii][Ll][Ll][Aa]-[Tt][Aa][Bb][Ss][Tt][Aa][Cc][Kk]|[Nn][Oo][Vv][Aa][Aa][Cc][Tt]|[Oo][Mm][Gg][Ii][Ll][Ii]|[Oo][Pp][Ee][Nn][Cc][Oo][Dd][Ee]|[Pp][Aa][Nn][Ss][Cc][Ii][Ee][Nn][Tt]|[Pp][Oo][Gg][Gg][Ii][Oo]-|[Qq][Oo][Dd][Ee][Rr][Cc][Ll][Ii]|[Tt][Ee][Rr][Rr][Aa] [Cc][Oo][Tt][Tt][Aa]|[Tt][Ee][Rr][Rr][Aa][Cc][Oo][Tt][Tt][Aa]|[Yy][Aa][Nn][Dd][Ee][Xx][Aa][Dd][Dd][Ii][Tt][Ii][Oo][Nn][Aa][Ll]|[Ii][Mm][Gg]2[Dd][Aa][Tt][Aa][Ss][Ee][Tt]|[Ll][Aa][Ii][Oo][Nn]|[Aa][Ii][Ww][Ee][Bb][Ii][Nn][Dd][Ee][Xx]|[Aa][Nn][Oo][Mm][Uu][Rr][Aa]|[Cc][Ll][Oo][Uu][Dd][Ff][Ll][Aa][Rr][Ee]-[Aa][Uu][Tt][Oo][Rr][Aa][Gg]|[Cc][Oo][Tt][Oo][Yy][Oo][Gg][Ii]|[Hh][Uu][Nn][Yy][Uu][Aa][Nn]).*",
        },
      ],
    },
  ],
};
