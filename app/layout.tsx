import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://stockone-nu.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "StockOne — Valores financieros de Argentina",
    template: "%s · StockOne",
  },
  description:
    "Dólares (blue, MEP, CCL, oficial), riesgo país, acciones, bonos, CEDEARs, letras e índices de USA. Todos los valores financieros de Argentina en un solo lugar, en vivo y gratis.",
  applicationName: "StockOne",
  keywords: [
    "dólar hoy",
    "dólar blue",
    "dólar MEP",
    "dólar CCL",
    "riesgo país",
    "acciones argentinas",
    "CEDEARs",
    "bonos",
    "Nasdaq",
    "merval",
    "cotizaciones",
    "bolsa argentina",
  ],
  authors: [{ name: "StockOne" }],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "StockOne — Valores financieros de Argentina",
    description:
      "Dólares, riesgo país, acciones, bonos, CEDEARs e índices USA. En vivo y en un solo lugar.",
    url: SITE_URL,
    siteName: "StockOne",
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "StockOne — Valores financieros de Argentina",
    description:
      "Dólares, riesgo país, acciones, bonos, CEDEARs e índices USA. En vivo y en un solo lugar.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
  category: "finance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
