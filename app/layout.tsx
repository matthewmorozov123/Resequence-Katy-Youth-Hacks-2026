import type { Metadata } from "next";
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "Resequence — Learn from today. Design tomorrow.",
  description: "An evidence-aware daily coach that helps you understand today and build a better sequence for tomorrow.",
  openGraph: {
    title: "Resequence",
    description: "Learn from today. Design tomorrow.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Resequence — Learn from today. Design tomorrow." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Resequence",
    description: "Learn from today. Design tomorrow.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={geistSans.variable + " " + geistMono.variable}>{children}</body>
    </html>
  );
}
