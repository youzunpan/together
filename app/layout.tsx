import type { Metadata } from "next";
import { Noto_Sans_TC, Noto_Serif_TC, Space_Mono } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

const notoSans = Noto_Sans_TC({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

const notoSerif = Noto_Serif_TC({
  variable: "--font-noto-serif",
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
  themeColor: "#001233",
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
      <body className="min-h-full flex flex-col" style={{ background: "#001233" }}>
        <main className="flex-1 pb-16">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
