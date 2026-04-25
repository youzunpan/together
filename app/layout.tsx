import type { Metadata } from "next";
import { Noto_Sans_TC, Noto_Serif_TC, Space_Mono } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import Splash from "@/components/Splash";

// Noto TC 仍透過 next/font 載入，作為 Zen 系列遇到日文未涵蓋字（部分繁體字）時的後備
const notoSans = Noto_Sans_TC({
  variable: "--font-fallback-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

const notoSerif = Noto_Serif_TC({
  variable: "--font-fallback-serif",
  subsets: ["latin"],
  weight: ["400", "600"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "同在",
  description: "一起靜坐的地方",
  appleWebApp: {
    capable: true,
    title: "同在",
    statusBarStyle: "black-translucent",
  },
};

export const viewport = {
  themeColor: "#1a1b18",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-TW"
      className={`${notoSans.variable} ${notoSerif.variable} ${spaceMono.variable} h-full`}
    >
      <head>
        {/* 日本字體：Zen Old Mincho（明朝）+ Zen Kaku Gothic New（黑體）
            Google Fonts 的 unicode-range 會自動只載入用到的字 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@300;400;500&family=Zen+Old+Mincho:wght@400;600&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col" style={{ background: "#1a1b18" }}>
        <Splash />
        <main
          className="flex-1"
          style={{
            paddingTop: "env(safe-area-inset-top)",
            paddingBottom: "calc(4rem + env(safe-area-inset-bottom))",
          }}
        >
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
