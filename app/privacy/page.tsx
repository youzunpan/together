import Link from "next/link";
import { LEGAL } from "@/lib/legal";

export const metadata = {
  title: `隱私政策 · ${LEGAL.brand}`,
};

export default function PrivacyPage() {
  return (
    <div className="max-w-md mx-auto px-5 py-8">
      <header className="mb-6">
        <Link
          href="/feed"
          style={{
            fontFamily: "var(--font-space-mono)",
            fontSize: "0.65rem",
            letterSpacing: "0.12em",
            color: "rgba(237,236,234,0.4)",
          }}
        >
          ← 回首頁
        </Link>
      </header>

      <h1
        style={{
          fontFamily: "var(--font-noto-serif)",
          fontSize: "1.75rem",
          color: "#edecea",
          fontWeight: 400,
          marginBottom: "0.25rem",
        }}
      >
        隱私政策
      </h1>
      <p
        style={{
          fontFamily: "var(--font-space-mono)",
          fontSize: "0.6rem",
          letterSpacing: "0.18em",
          color: "rgba(237,236,234,0.3)",
          marginBottom: "2rem",
        }}
      >
        PRIVACY · 最後更新 {LEGAL.lastUpdated}
      </p>

      <div style={proseStyle}>
        <p>
          {LEGAL.brand}（以下簡稱「本服務」）是一個邀請制的線上靜坐社群。
          本政策說明我們收集你的哪些資料、為什麼、怎麼用、保存多久，以及你可以怎麼處理它們。
        </p>

        <h2 style={h2Style}>我們收集的資料</h2>
        <ul style={ulStyle}>
          <li><b>申請資訊</b>：email、顯示名稱、申請密碼（加密儲存）、自介。</li>
          <li><b>個人設定</b>：頭像字、頭像顏色、頭像照片（自選上傳）、提醒時段。</li>
          <li><b>靜坐紀錄</b>：每次坐的時間、長度、心得（自選填寫）。</li>
          <li><b>同心呼喚</b>：你發起或加入的活動。</li>
          <li><b>推播訂閱</b>：若你開啟通知，我們會儲存裝置的推播 endpoint。</li>
          <li><b>錯誤記錄</b>：若 app 出錯，可能會記錄錯誤訊息與你的使用者 id，用於修復。</li>
        </ul>
        <p style={{ color: "rgba(237,236,234,0.5)" }}>
          我們<b>不</b>使用第三方追蹤、廣告或分析。
        </p>

        <h2 style={h2Style}>用途</h2>
        <ul style={ulStyle}>
          <li>提供服務本身（顯示你的紀錄、讓你跟同伴互動）。</li>
          <li>寄送與帳號相關的 email（申請通過、忘記密碼）。</li>
          <li>當你開啟通知時，推播靜坐結束鈴聲、同心活動、每日提醒。</li>
        </ul>

        <h2 style={h2Style}>資料儲存與處理</h2>
        <ul style={ulStyle}>
          <li>資料儲存於 Supabase（資料庫）與 Vercel（網站）等服務商。</li>
          <li>密碼使用業界標準 bcrypt 雜湊；申請待審核的密碼以 AES-256 加密。</li>
          <li>email 寄送由 Resend 處理，僅在必要時使用。</li>
        </ul>

        <h2 style={h2Style}>保存期限</h2>
        <ul style={ulStyle}>
          <li>你<b>主動刪除帳號</b>後，資料會立即永久清除。</li>
          <li>系統備份檔可能包含已刪資料約 30 天，之後自動消失。</li>
          <li>錯誤記錄保留至管理員手動清除。</li>
        </ul>

        <h2 style={h2Style}>你的權利</h2>
        <ul style={ulStyle}>
          <li><b>查閱與更新</b>：在「設定」頁可隨時更改顯示名稱、頭像、密碼、提醒設定。</li>
          <li><b>刪除</b>：「設定」頁底部可永久刪除帳號。</li>
          <li><b>聯絡</b>：其他疑問可寄信至 <a href={`mailto:${LEGAL.contactEmail}`} style={linkStyle}>{LEGAL.contactEmail}</a>。</li>
        </ul>

        <h2 style={h2Style}>未成年</h2>
        <p>
          本服務不主動針對未滿 14 歲的兒童設計。若你未滿 14 歲，請與監護人一同使用。
        </p>

        <h2 style={h2Style}>政策變更</h2>
        <p>
          本政策若有重大變更，會在 app 內公告。
        </p>

        <h2 style={h2Style}>聯絡</h2>
        <p>
          資料控管者：{LEGAL.controller}<br />
          聯絡：<a href={`mailto:${LEGAL.contactEmail}`} style={linkStyle}>{LEGAL.contactEmail}</a>
        </p>
      </div>

      <p
        style={{
          marginTop: "3rem",
          textAlign: "center",
          fontFamily: "var(--font-space-mono)",
          fontSize: "0.6rem",
          letterSpacing: "0.12em",
          color: "rgba(237,236,234,0.3)",
        }}
      >
        <Link href="/terms" style={linkStyle}>服務條款</Link>
      </p>
    </div>
  );
}

const proseStyle: React.CSSProperties = {
  fontSize: "0.92rem",
  color: "rgba(237,236,234,0.75)",
  lineHeight: 1.85,
};

const h2Style: React.CSSProperties = {
  fontFamily: "var(--font-noto-serif)",
  fontSize: "1.05rem",
  color: "#edecea",
  marginTop: "2rem",
  marginBottom: "0.5rem",
  fontWeight: 400,
};

const ulStyle: React.CSSProperties = {
  paddingLeft: "1.25rem",
  margin: "0.25rem 0 0.75rem",
  display: "block",
  listStyle: "disc",
};

const linkStyle: React.CSSProperties = {
  color: "#BEC23F",
  textDecoration: "underline",
  textUnderlineOffset: "3px",
};
