import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { TopNav } from "./components/top-nav";
import { cn } from "@/lib/utils";
import { getStreams } from "@/app/actions/streams";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hermes",
  description: "Your daily briefing",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const streams = await getStreams();

  return (
    <html lang="en" className={cn("h-full", "antialiased", inter.variable, "font-sans", geist.variable)}>
      <body className="min-h-full flex flex-col">
        <TopNav streams={streams.map((s) => ({ id: s.id, key: s.key, name: s.name }))} />
        <main className="pt-32 pb-24 px-6 md:px-12 max-w-7xl mx-auto w-full flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}
