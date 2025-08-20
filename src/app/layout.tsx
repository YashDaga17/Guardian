import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { LoadingProvider } from "@/components/ui/LoadingProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  title: "Guardian - DeFi Portfolio Management",
  description: "Advanced DeFi portfolio management with AI-powered insights and state channel optimization",
  keywords: ["DeFi", "portfolio", "management", "AI", "blockchain", "crypto"],
  authors: [{ name: "Guardian Team" }],
  creator: "Guardian",
  publisher: "Guardian",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://guardian-defi.com",
    siteName: "Guardian DeFi",
    title: "Guardian - DeFi Portfolio Management",
    description: "Advanced DeFi portfolio management with AI-powered insights",
    images: [
      {
        url: "/opengraph-image.svg",
        width: 1200,
        height: 630,
        alt: "Guardian DeFi Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@guardian_defi",
    creator: "@guardian_defi",
    title: "Guardian - DeFi Portfolio Management",
    description: "Advanced DeFi portfolio management with AI-powered insights",
    images: ["/twitter-image.svg"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.svg",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <Providers>
            <LoadingProvider>
              <div className="flex h-screen bg-background">
                <Sidebar />
                <div className="flex-1 flex flex-col overflow-hidden">
                  <Header />
                  <main className="flex-1 overflow-auto p-6">
                    {children}
                  </main>
                </div>
              </div>
            </LoadingProvider>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
