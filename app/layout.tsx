import type { Metadata } from "next";
import { Noto_Sans_TC, Noto_Serif_TC, Space_Mono } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import Splash from "@/components/Splash";
import ErrorReporter from "@/components/ErrorReporter";
import SWNavigationListener from "@/components/SWNavigationListener";

// 襯線：思源宋體 TW（= Google 託管的 Noto Serif TC，繁體支援完整）
const notoSerif = Noto_Serif_TC({
  variable: "--font-noto-serif",
  subsets: ["latin"],
  weight: ["400", "600"],
});

// 黑體：保留 Noto Sans TC 作為 Zen Kaku Gothic 的繁體 fallback
const notoSans = Noto_Sans_TC({
  variable: "--font-fallback-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
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
      className={`${notoSans.variable} ${notoSerif.variable} ${spaceMono.variable} min-h-dvh`}
    >
      <head>
        {/* 日本黑體（Zen Kaku Gothic New）— 給一般 UI 文字增加日式留白感
            繁體中文走思源宋體 (Noto Serif TC) / 黑體 fallback */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@300;400;500&display=swap"
        />
      </head>
      <body className="min-h-dvh flex flex-col" style={{ background: "#1a1b18" }}>
        <ErrorReporter />
        <SWNavigationListener />
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
