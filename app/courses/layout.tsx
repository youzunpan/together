// 公開課程區的版面：頂部品牌 + 麵包屑、底部極簡 footer。
// BottomNav 在 /courses 路徑下會隱藏（見 components/BottomNav.tsx 的 hideOn）。

import Link from "next/link";

export default function CoursesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col px-6 py-10" style={{ paddingTop: "calc(env(safe-area-inset-top) + 2.5rem)" }}>
      <header className="text-center mb-12">
        <Link href="/courses" style={{ display: "inline-block", textDecoration: "none" }}>
          <p style={{ fontFamily: "var(--font-noto-serif)", fontSize: "2.5rem", color: "#edecea", lineHeight: 1 }}>同在</p>
          <p style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", letterSpacing: "0.25em", color: "rgba(237,236,234,0.3)", marginTop: "0.5rem" }}>
            COURSES
          </p>
        </Link>
      </header>

      <div className="flex-1 w-full max-w-xl mx-auto">
        {children}
      </div>

      <footer className="text-center mt-16 pb-6">
        <p style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", letterSpacing: "0.12em" }}>
          <Link href="/login" style={{ color: "rgba(237,236,234,0.35)", textDecoration: "underline", textUnderlineOffset: "3px" }}>
            我已是學員
          </Link>
          <span style={{ color: "rgba(237,236,234,0.2)", margin: "0 0.5rem" }}>·</span>
          <Link href="/terms" style={{ color: "rgba(237,236,234,0.35)", textDecoration: "underline", textUnderlineOffset: "3px" }}>
            服務條款
          </Link>
          <span style={{ color: "rgba(237,236,234,0.2)", margin: "0 0.5rem" }}>·</span>
          <Link href="/privacy" style={{ color: "rgba(237,236,234,0.35)", textDecoration: "underline", textUnderlineOffset: "3px" }}>
            隱私政策
          </Link>
        </p>
      </footer>
    </div>
  );
}
