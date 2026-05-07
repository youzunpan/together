"use server";

import { createClient } from "@/lib/supabase-server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/email";
import { APP_TZ } from "@/lib/tz";

const TEACHER_NAME = "樽";
const TEACHER_EMAIL = "youzunpan@gmail.com";

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "未登入" as const };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") return { error: "無權限" as const };
  return { user };
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("zh-TW", {
    timeZone: APP_TZ,
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("zh-TW", {
    timeZone: APP_TZ,
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// =========================================================
// 公開 action：學生報名
// =========================================================
export async function submitRegistration(slug: string, formData: FormData) {
  const name = (formData.get("name") as string | null)?.trim();
  const email = (formData.get("email") as string | null)?.trim().toLowerCase();
  const line_id = (formData.get("line_id") as string | null)?.trim() || null;
  const transfer_last4 = (formData.get("transfer_last4") as string | null)?.trim() || null;

  if (!name || !email) return { error: "請填寫名字與 email" };
  if (name.length > 60) return { error: "名字過長" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "email 格式不正確" };
  if (line_id && line_id.length > 60) return { error: "Line ID 過長" };
  if (transfer_last4 && !/^[0-9]{4}$/.test(transfer_last4)) return { error: "匯款末四碼需為 4 位數字" };

  const sb = serviceClient();

  // 透過 RPC 原子化檢查名額並寫入
  const { data: rpcRes, error: rpcErr } = await sb.rpc("register_for_course", {
    p_slug: slug,
    p_name: name,
    p_email: email,
    p_line_id: line_id,
    p_transfer_last4: transfer_last4,
  });

  if (rpcErr) {
    console.error("[registrations] rpc error", rpcErr);
    return { error: "系統錯誤，請稍後再試" };
  }

  if (rpcRes?.error === "course_not_found") return { error: "找不到此課程" };
  if (rpcRes?.error === "course_not_open") return { error: "此課程目前未開放報名" };
  if (rpcRes?.error === "full") return { error: "名額已滿。" };
  if (rpcRes?.error === "duplicate") return { error: "這個 email 已經報過此課程了。" };
  if (rpcRes?.error === "bad_last4") return { error: "匯款末四碼需為 4 位數字" };

  // 撈課程內容寄確認信（失敗不影響報名成立）
  try {
    const { data: course } = await sb
      .from("courses")
      .select("title,format,start_at,end_at,schedule_note,location,price_note,duration_type")
      .eq("slug", slug)
      .single();

    if (course) {
      const isOnline = course.format === "online";
      const formatLabel = isOnline ? "線上課" : "實體課";
      const dateStr = course.duration_type === "series"
        ? `${formatDate(course.start_at)}${course.end_at ? `　至　${formatDate(course.end_at)}` : ""}`
        : formatDateTime(course.start_at);

      const lines: string[] = [
        `<li><b>類型：</b>${formatLabel}</li>`,
        `<li><b>時間：</b>${escapeHtml(dateStr)}</li>`,
      ];
      if (course.schedule_note) lines.push(`<li><b>上課時間：</b>${escapeHtml(course.schedule_note)}</li>`);
      if (course.location) lines.push(`<li><b>${isOnline ? "線上資訊" : "地點"}：</b>${escapeHtml(course.location)}</li>`);
      if (course.price_note) lines.push(`<li><b>費用：</b>${escapeHtml(course.price_note)}</li>`);

      // 還沒填末四碼 → 提醒；已填 → 確認
      const paymentBlock = transfer_last4
        ? `<p style="margin:0 0 12px;">已收到你填寫的匯款末四碼 <b>${escapeHtml(transfer_last4)}</b>，將與你的入帳記錄對照。</p>`
        : `<p style="margin:0 0 12px;">完成匯款後，可以直接回這封信告知<b>匯款末四碼</b>，協助我對帳。</p>`;

      await sendEmail({
        to: email,
        reply_to: TEACHER_EMAIL,
        subject: `同在 · 已收到你報名「${course.title}」`,
        html: `
          <div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1a1b18;line-height:1.7;">
            <h2 style="font-weight:normal;font-size:1.15rem;margin:0 0 16px;">${escapeHtml(name)}，謝謝你報名「${escapeHtml(course.title)}」。</h2>
            <p style="margin:0 0 12px;">我已經收到你的報名，以下是課程資訊：</p>
            <ul style="padding-left:20px;color:#333;margin:0 0 20px;">
              ${lines.join("\n              ")}
            </ul>
            ${paymentBlock}
            <p style="margin:0 0 12px;">將在開課前再次與你聯繫上課細節。</p>
            <p style="margin:0 0 24px;color:#555;">有任何問題歡迎直接回信，會回到 ${TEACHER_EMAIL}。</p>
            <p style="margin:32px 0 0;color:#888;font-size:13px;">— ${TEACHER_NAME}</p>
          </div>
        `,
      });
    }
  } catch (e) {
    console.error("[registrations] send confirmation email failed", e);
  }

  revalidatePath(`/courses/${slug}`);
  revalidatePath("/admin");
  return { ok: true };
}

// =========================================================
// admin action：標記狀態 / 刪除報名
// =========================================================
export async function updateRegistrationStatus(
  id: string,
  status: "pending" | "confirmed" | "cancelled",
) {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const sb = serviceClient();
  const { error } = await sb.from("registrations").update({ status }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { ok: true };
}

export async function deleteRegistration(id: string) {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const sb = serviceClient();
  const { error } = await sb.from("registrations").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { ok: true };
}
