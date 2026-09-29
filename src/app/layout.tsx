import type { Metadata, Viewport } from "next";
import { getCurrentUser } from "@/lib/auth";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import "./globals.css";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "GamesHunter";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Encuentra tu próximo platino`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Base de datos y guías de trofeos de PS4 y PS5. Dificultad del Platino, tiempos estimados, lista completa de trofeos, avisos de trofeos perdibles y online, y guías paso a paso.",
  applicationName: SITE_NAME,
  keywords: [
    "trofeos PS4",
    "trofeos PS5",
    "guía platino",
    "dificultad platino",
    "juegos PS5",
    "juegos PS4",
    "lista de trofeos",
    "trofeos perdibles",
  ],
  authors: [{ name: SITE_NAME }],
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "es_ES",
    url: SITE_URL,
    title: `${SITE_NAME} — Encuentra tu próximo platino`,
    description:
      "Busca tu próximo juego y consulta dificultad del Platino, tiempos, trofeos perdibles y guías paso a paso.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Encuentra tu próximo platino`,
    description: "Dificultad del Platino, tiempos, trofeos y guías de PS4 y PS5.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#0b0f14",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <html lang="es">
      <body className="min-h-dvh">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-accent-600 focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white"
        >
          Saltar al contenido
        </a>
        <div className="flex min-h-dvh flex-col">
          <Header user={user} />
          <main id="contenido" className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
