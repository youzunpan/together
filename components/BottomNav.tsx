"use client";

import { useEffect, useRef, useState } from "react";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { markRepliesViewed } from "@/lib/actions/replies";

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
    href: "/me/courses",
    label: "課程",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 1.5 : 1} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4z" />
        <path d="M4 16a4 4 0 0 1 4-4h12" />
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
  badge,
}: {
  label: string;
  icon: (active: boolean) => React.ReactNode;
  active: boolean;
  badge?: number;
}) {
  const { pending } = useLinkStatus();
  // 點下去的瞬間就視覺上變成 active，等伺服器渲染時不顯得遲鈍
  const lit = active || pending;
  return (
    <div
      // 手機：icon 在上、字在下的直式小格
      // 桌機：icon 在左、字在右的一整列，點擊區域拉到整欄寬
      className="flex flex-col items-center gap-0.5 min-w-[56px] lg:flex-row lg:gap-3 lg:min-w-0 lg:w-full lg:px-3 lg:py-2.5 lg:rounded"
      style={{
        color: lit ? "#BEC23F" : "rgba(237,236,234,0.3)",
        background: lit ? "rgba(190,194,63,0.08)" : "transparent",
        transition: "color 0.1s, background 0.15s",
      }}
    >
      {/* icon 包一層 inline-flex + lineHeight:0：消除 SVG 的 inline baseline
          描述符空間（不然 wrapper 會比 SVG 多 ~4px，讓 icon 在 56px 容器裡
          的垂直中心下沉，每個頁面看起來高度不一致） */}
      <span style={{ position: "relative", display: "inline-flex", lineHeight: 0 }}>
        {icon(lit)}
        {badge !== undefined && badge > 0 && (
          <span
            aria-label={`${badge} 則未讀回應`}
            style={{
              position: "absolute",
              top: -2,
              right: -6,
              minWidth: "1rem",
              height: "1rem",
              padding: "0 0.25rem",
              borderRadius: 999,
              background: "#D65C6A",
              color: "#1a1b18",
              fontFamily: "var(--font-space-mono)",
              fontSize: "0.55rem",
              fontWeight: 600,
              lineHeight: 1,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </span>
      <span className="text-[0.6rem] lg:text-[0.82rem]" style={{ letterSpacing: "0.1em" }}>{label}</span>
    </div>
  );
}

// /me 與 /me/courses 是兩個 tab；不能簡單 startsWith("/me")（會兩個都亮）。
// /me/settings 屬於 /me tab；/me/courses/* 跟 /courses/* 屬於 /me/courses tab。
function isActive(href: string, pathname: string): boolean {
  if (href === "/me") {
    return pathname === "/me" || pathname.startsWith("/me/settings");
  }
  if (href === "/me/courses") {
    return (
      pathname === "/me/courses" ||
      pathname.startsWith("/me/courses/") ||
      pathname === "/courses" ||
      pathname.startsWith("/courses/")
    );
  }
  return pathname === href || pathname.startsWith(href + "/");
}

export default function BottomNav() {
  const pathname = usePathname();
  // 登入狀態：null = 還沒確定；true/false = 確定後
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [unreadReplies, setUnreadReplies] = useState(0);
  const lastViewRef = useRef<string>("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_, session) => {
      setAuthed(!!session);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // 查未讀回應（only when logged in），每分鐘 + visibility 變化時更新
  useEffect(() => {
    if (authed !== true) return;
    let cancelled = false;
    const supabase = createClient();
    async function fetchUnread() {
      const { data } = await supabase
        .from("my_unread_replies")
        .select("unread_count")
        .maybeSingle();
      if (!cancelled) setUnreadReplies(data?.unread_count ?? 0);
    }
    fetchUnread();
    const interval = setInterval(fetchUnread, 60_000);
    document.addEventListener("visibilitychange", fetchUnread);
    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", fetchUnread);
    };
  }, [authed, pathname]);

  // 進 /me 自動標記為已讀
  useEffect(() => {
    if (authed !== true) return;
    if (pathname !== "/me") return;
    if (lastViewRef.current === pathname) return;
    lastViewRef.current = pathname;
    setUnreadReplies(0); // 樂觀清零
    markRepliesViewed().catch(() => {});
  }, [pathname, authed]);

  // /login /apply 永遠隱藏
  if (pathname.startsWith("/login") || pathname.startsWith("/apply")) return null;

  // /courses 路徑：只在「確認登入」時才顯示，匿名或還在判斷時都先隱藏
  // 避免公開訪客先看到 nav 再閃掉
  if (pathname.startsWith("/courses") && authed !== true) return null;

  return (
    <nav
      // 手機：貼底的 tab bar。桌機（lg↑）：貼左的直向導覽，寬度對齊 --nav-w
      className="fixed z-50 bottom-0 left-0 right-0 border-t border-white/[0.06] lg:top-0 lg:bottom-0 lg:right-auto lg:w-[13rem] lg:border-t-0 lg:border-r"
      style={{
        background: "rgba(26,27,24,0.92)",
        backdropFilter: "blur(12px)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* 桌機才有的品牌標：手機頂部已經有「同在 · TOGETHER」，不重複 */}
      <p
        className="hidden lg:block px-6 pt-7 pb-6"
        style={{
          fontFamily: "var(--font-noto-serif)",
          fontSize: "1.05rem",
          letterSpacing: "0.22em",
          color: "rgba(237,236,234,0.75)",
        }}
      >
        同在
      </p>

      <div className="flex items-center justify-around max-w-md mx-auto h-14 px-4 lg:flex-col lg:items-stretch lg:justify-start lg:h-auto lg:max-w-none lg:mx-0 lg:px-3 lg:gap-1">
        {navItems.map(({ href, label, icon }) => {
          const active = isActive(href, pathname);
          return (
            <Link key={href} href={href} prefetch className="lg:w-full">
              <TabContent
                label={label}
                icon={icon}
                active={active}
                badge={href === "/me" ? unreadReplies : 0}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
