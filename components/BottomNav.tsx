"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    href: "/feed",
    label: "同在",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 1.5 : 1} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: "/sit",
    label: "靜心",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 1.5 : 1} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    href: "/me",
    label: "我",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 1.5 : 1} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

// 必須在 Link 的子元件內呼叫 useLinkStatus，才能拿到該 Link 的 pending 狀態
function TabContent({
  label,
  icon,
  active,
}: {
  label: string;
  icon: (active: boolean) => React.ReactNode;
  active: boolean;
}) {
  const { pending } = useLinkStatus();
  // 點下去的瞬間就視覺上變成 active，等伺服器渲染時不顯得遲鈍
  const lit = active || pending;
  return (
    <div
      className="flex flex-col items-center gap-0.5 min-w-[56px]"
      style={{
        color: lit ? "#BEC23F" : "rgba(237,236,234,0.3)",
        transition: "color 0.1s",
      }}
    >
      {icon(lit)}
      <span style={{ fontSize: "0.6rem", letterSpacing: "0.1em" }}>{label}</span>
    </div>
  );
}

export default function BottomNav() {
  const pathname = usePathname();
  const hideOn = ["/login", "/apply"];
  if (hideOn.some((p) => pathname.startsWith(p))) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: "rgba(26,27,24,0.92)",
        backdropFilter: "blur(12px)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="flex items-center justify-around max-w-md mx-auto h-14 px-4">
        {navItems.map(({ href, label, icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link key={href} href={href} prefetch>
              <TabContent label={label} icon={icon} active={active} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
