
import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MediLocate | Hospital Discovery",
  description:
    "Discover nearby hospitals through location-based search and multi-criteria recommendations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
            <Link
              href="/"
              className="text-lg font-bold text-slate-900"
            >
              MediLocate
            </Link>

            <nav
              aria-label="Main navigation"
              className="flex items-center gap-2"
            >
              <Link
                href="/"
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Home
              </Link>

              <Link
                href="/about"
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                About
              </Link>
            </nav>
          </div>
        </header>

        {children}
      </body>
    </html>
  );
}
