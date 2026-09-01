import {
  ClerkProvider,
} from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist, Geist_Mono, IBM_Plex_Sans, Source_Sans_3 } from "next/font/google";

import { SiteHeader } from "@/components/site-header";
import { cn } from "@/lib/utils";

import "./globals.css";

const sourceSans3Heading = Source_Sans_3({subsets:['latin'],variable:'--font-heading'});

const ibmPlexSans = IBM_Plex_Sans({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Crosscheck Sheet",
  description: "Crosscheck Sheet",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", ibmPlexSans.variable, sourceSans3Heading.variable)}
    >
      <body className="flex min-h-full flex-col">
        <ClerkProvider>
          <SiteHeader />
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
