import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";

import { CircuitBackground } from "@/components/atoms/CircuitBackground";
import { PoweredByFooter } from "@/components/atoms/PoweredByFooter";

import { Providers } from "./Providers";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Moneta",
  description: "Your personal financial assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <CircuitBackground className="flex flex-1 flex-col">
            {children}
            <PoweredByFooter />
          </CircuitBackground>
        </Providers>
      </body>
    </html>
  );
}
