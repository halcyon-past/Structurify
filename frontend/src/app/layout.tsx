import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { Toaster } from "react-hot-toast";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://structurify.aritro.cloud"),
  title: "Structurify | AI-Powered Data Extraction & Schema Enforcement",
  description: "Transform messy, unstructured spreadsheets into strict, machine-readable JSON or Excel schemas using LLM. The ultimate automated ETL pipeline.",
  keywords: ["ETL", "Data Engineering", "Data Transformation", "AI", "LLM", "Schema Enforcement", "CSV to JSON"],
  openGraph: {
    title: "Structurify | AI-Powered Data Extraction",
    description: "Transform unstructured spreadsheets into strict schemas instantly using AI.",
    url: "https://structurify.aritro.cloud",
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
        className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <AuthProvider>
          <div className="absolute top-0 w-full z-50">
            <Header />
          </div>
          {children}
          <Toaster position="bottom-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
