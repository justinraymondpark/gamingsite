import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif, Silkscreen, Space_Grotesk } from "next/font/google";
import "./globals.css";
import ThemeLab from "@/components/ThemeLab";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

const silkscreen = Silkscreen({
  variable: "--font-silkscreen",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Toupee's MediaLog",
  description: "Games, music, movies & TV - journal and reviews",
};

// Applies saved theme prefs before first paint to avoid a flash of the wrong theme
const themeInitScript = `(function(){try{var p=JSON.parse(localStorage.getItem('medialog-theme')||'{}');var d=document.documentElement.dataset;d.theme=['aurora','arcade','editorial'].indexOf(p.theme)>=0?p.theme:'aurora';['backdrop','scanlines','glow','blur','serif','frames','motion'].forEach(function(k){d['fx'+k.charAt(0).toUpperCase()+k.slice(1)]=p[k]===false?'off':'on';});}catch(e){document.documentElement.dataset.theme='aurora';}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} ${instrumentSerif.variable} ${silkscreen.variable}`}
    >
      <body className="antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {children}
        <ThemeLab />
      </body>
    </html>
  );
}
