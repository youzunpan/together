// 簡單 email 寄送 — 走 Resend API。未設定 RESEND_API_KEY 則 no-op（開發時不會報錯）。
// 之後決定網域後再填 RESEND_API_KEY 和 EMAIL_FROM 到 .env.local 即可。

type SendArgs = { to: string; subject: string; html: string; reply_to?: string };

export async function sendEmail({ to, subject, html, reply_to }: SendArgs) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    console.log(`[email skipped] to=${to} subject=${subject}`);
    return { skipped: true as const };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, html, ...(reply_to ? { reply_to } : {}) }),
  });

  if (!res.ok) {
    const body = await res.text();
    return { error: `resend ${res.status}: ${body}` as const };
  }
  return { ok: true as const };
}
