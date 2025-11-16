import type { Metadata } from "next";
import { Geist_Mono, Montserrat } from "next/font/google";
import "./globals.css";
import LoadingProvider from "./layout/loading-provider";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "watts-your-impact",
  description:
    "watts-your-impact is a podcast exploring electrifying ideas, climate tech, and the people powering change.",
  // Use WYi logo as the site icon + social preview image
  icons: {
    icon: "/images/logo.svg",
  },
  openGraph: {
    title: "watts-your-impact",
    description:
      "watts-your-impact is a podcast exploring electrifying ideas, climate tech, and the people powering change.",
    images: ["/images/wyilogos/wyiyellow.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "watts-your-impact — Podcast",
    description:
      "watts-your-impact is a podcast exploring electrifying ideas, climate tech, and the people powering change.",
    images: ["/images/wyilogos/wyiyellow.png"],
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
        className={`${montserrat.variable} ${geistMono.variable} antialiased`}
      >
        <LoadingProvider>{children}</LoadingProvider>
      </body>
    </html>
  );
}
