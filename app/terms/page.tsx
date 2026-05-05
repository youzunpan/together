import Link from "next/link";
import { LEGAL } from "@/lib/legal";

export const metadata = {
  title: `服務條款 · ${LEGAL.brand}`,
};

export default function TermsPage() {
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
        服務條款
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
        TERMS · 最後更新 {LEGAL.lastUpdated}
      </p>

      <div style={proseStyle}>
        <p>
          歡迎來到 {LEGAL.brand}。在使用本服務前，請花一點時間讀完下面這些約定。
          使用本服務即表示你同意這些條款。
        </p>

        <h2 style={h2Style}>關於本服務的本質</h2>
        <p>
          {LEGAL.brand} 是一個邀請制的線上靜坐社群，提供計時、紀錄、互邀共修等功能。
          它<b>不是</b>任何形式的醫療、心理治療或專業健康建議。
          若你有身心健康上的疑慮，請尋求合格專業人員協助。
        </p>

        <h2 style={h2Style}>申請與帳號</h2>
        <ul style={ulStyle}>
          <li>本服務目前以邀請 / 申請審核制運作。送出申請不保證通過。</li>
          <li>請使用真實 email 與你願意被同伴認得的顯示名稱。</li>
          <li>你應對自己的密碼妥善保管；若發現帳號被盜用，請立即聯絡我們。</li>
        </ul>

        <h2 style={h2Style}>使用守則</h2>
        <ul style={ulStyle}>
          <li>請對其他成員保持基本的尊重。</li>
          <li>不要發布騷擾、歧視、廣告、惡意連結等內容。</li>
          <li>同心呼喚的訊息與靜坐心得是給社群看的，請自行斟酌分寸。</li>
          <li>違反守則者，管理員可移除其發文、暫停或永久撤銷帳號。</li>
        </ul>

        <h2 style={h2Style}>內容所有權</h2>
        <p>
          你發布在 {LEGAL.brand} 的文字、頭像等內容，所有權仍屬於你；
          你授予 {LEGAL.brand} 在服務內顯示、儲存、傳輸這些內容的非專屬授權。
          你刪除內容或帳號後，這個授權即終止。
        </p>

        <h2 style={h2Style}>服務變更與終止</h2>
        <ul style={ulStyle}>
          <li>本服務目前免費。我們可能在事先通知後調整功能、暫停或結束服務。</li>
          <li>你可以隨時在「設定」頁刪除帳號，無需理由。</li>
        </ul>

        <h2 style={h2Style}>免責聲明</h2>
        <p>
          本服務以「現狀」提供。我們會盡力維持穩定與安全，但無法保證完全無錯誤、無中斷。
          因不可抗力或第三方服務（如 Supabase、Vercel）異常造成的不便，請見諒。
        </p>

        <h2 style={h2Style}>條款變更</h2>
        <p>
          本條款若有重大變更，會在 app 內公告。
          繼續使用即視為同意更新後的條款。
        </p>

        <h2 style={h2Style}>聯絡</h2>
        <p>
          營運單位：{LEGAL.controller}<br />
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
        <Link href="/privacy" style={linkStyle}>隱私政策</Link>
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
