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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://wattsyourimpact.com";

const siteTitle = "Watts Your Impact | A Podcast on Changemakers & Impact";
const siteDescription =
  "Watts Your Impact is a podcast exploring the authentic journeys of changemakers who are shaping industries, building communities, and driving meaningful impact. Listen on Spotify, Apple Podcasts, and YouTube.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: "%s | Watts Your Impact",
  },
  description: siteDescription,
  applicationName: "Watts Your Impact",
  keywords: [
    "Watts Your Impact",
    "podcast",
    "changemakers",
    "impact podcast",
    "career",
    "entrepreneurship",
    "sustainability",
    "community impact",
    "inspiring stories",
  ],
  authors: [{ name: "Watts Your Impact" }],
  creator: "Watts Your Impact",
  publisher: "Watts Your Impact",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
  // Use WYi logo as the site icon + social preview image
  icons: {
    icon: "/images/logo.svg",
  },
  openGraph: {
    type: "website",
    siteName: "Watts Your Impact",
    title: siteTitle,
    description: siteDescription,
    url: siteUrl,
    locale: "en_US",
    images: [
      {
        url: "/images/wyilogos/wyiyellow.png",
        alt: "Watts Your Impact podcast logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@wattsyourimpact",
    creator: "@wattsyourimpact",
    title: siteTitle,
    description: siteDescription,
    images: ["/images/wyilogos/wyiyellow.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "PodcastSeries",
    name: "Watts Your Impact",
    description: siteDescription,
    url: siteUrl,
    image: `${siteUrl}/images/wyilogos/wyiyellow.png`,
    inLanguage: "en",
    webFeed: "https://www.youtube.com/@wattsyourimpact",
    sameAs: [
      "https://open.spotify.com/show/2WuXt8alcwRm3FGOpt9Qkh",
      "https://podcasts.apple.com/us/podcast/watts-your-impact/id1791522753",
      "https://www.youtube.com/@wattsyourimpact",
      "https://instagram.com/wattsyourimpact",
      "https://x.com/wattsyourimpact",
      "https://www.tiktok.com/@wattsyourimpact",
    ],
  };

  return (
    <html lang="en">
      <body
        className={`${montserrat.variable} ${geistMono.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <LoadingProvider>{children}</LoadingProvider>
      </body>
    </html>
  );
}
