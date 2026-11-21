import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { Nav } from "@/components/Nav";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "RAG sobre la documentación de Next.js",
  description: "Buscador RAG sobre la documentación de Next.js, con evaluación medible.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${plexSans.variable} ${plexMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <header className="border-b border-line">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
            <p className="glow py-4 font-mono text-base font-medium sm:text-lg">
              RAG <span className="text-muted">· Docs de Next.js 16.4</span>
            </p>
            <Nav />
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </body>
    </html>
  );
}
