import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Structurify | AI-Powered Data Extraction & Schema Enforcement",
  description: "Transform messy, unstructured spreadsheets into strict, machine-readable JSON or Excel schemas using Google Gemini 2.5 Flash. The ultimate automated ETL pipeline.",
  keywords: ["ETL", "Data Engineering", "Data Transformation", "AI", "Gemini", "Schema Enforcement", "CSV to JSON"],
  openGraph: {
    title: "Structurify | AI-Powered Data Extraction",
    description: "Transform unstructured spreadsheets into strict schemas instantly using AI.",
    url: "https://structurify.web.app",
    siteName: "Structurify",
    images: [
      {
        url: "/logo.svg", // Fallback, normally you'd use a PNG/JPG for OG Image
        width: 800,
        height: 600,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Structurify | AI Data Transformation",
    description: "Transform messy spreadsheets into strict JSON schemas effortlessly.",
    images: ["/logo.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
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
        {children}
      </body>
    </html>
  );
}
