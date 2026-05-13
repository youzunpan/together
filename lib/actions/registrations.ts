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
  const reg_type = (formData.get("reg_type") as string | null) ?? "series";
  // sessions_csv：單堂時帶 "uuid,uuid,uuid"；整期時空字串
  const sessionsCsv = (formData.get("sessions_csv") as string | null)?.trim() ?? "";

  if (!name || !email) return { error: "請填寫名字與 email" };
  if (name.length > 60) return { error: "名字過長" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "email 格式不正確" };
  if (line_id && line_id.length > 60) return { error: "Line ID 過長" };
  if (transfer_last4 && !/^[0-9]{4}$/.test(transfer_last4)) return { error: "匯款末四碼需為 4 位數字" };

  // 解析 session_ids
  let sessionIds: string[] | null = null;
  if (reg_type === "single") {
    sessionIds = sessionsCsv.split(",").map(s => s.trim()).filter(Boolean);
    if (sessionIds.length === 0) return { error: "請至少選一堂" };
    // uuid 格式檢查
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!sessionIds.every(s => uuidRe.test(s))) return { error: "課堂資料異常" };
  }

  // 已登入則帶 user_id（綁定到 feed 帳號）；匿名照舊
  let userId: string | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    userId = data.user?.id ?? null;
  } catch {}

  const sb = serviceClient();

  // 透過 RPC 原子化檢查名額並寫入
  const { data: rpcRes, error: rpcErr } = await sb.rpc("register_for_course", {
    p_slug: slug,
    p_name: name,
    p_email: email,
    p_line_id: line_id,
    p_transfer_last4: transfer_last4,
    p_user_id: userId,
    p_session_ids: sessionIds,
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
      .select("id,title,format,start_at,end_at,schedule_note,location,price_note,duration_type")
      .eq("slug", slug)
      .single();

    if (course) {
      const { data: sessionRows } = await sb
        .from("course_sessions")
        .select("session_at, note")
        .eq("course_id", course.id)
        .order("session_at", { ascending: true });
      const sessions = sessionRows ?? [];

      const isOnline = course.format === "online";
      const formatLabel = isOnline ? "線上課" : "實體課";

      // 上課日期（多堂用 ul，單堂用一行）
      let dateBlock: string;
      if (sessions.length === 0) {
        dateBlock = `<li><b>時間：</b>${escapeHtml(formatDateTime(course.start_at))}</li>`;
      } else if (course.duration_type === "single" || sessions.length === 1) {
        dateBlock = `<li><b>時間：</b>${escapeHtml(formatDateTime(sessions[0].session_at))}</li>`;
      } else {
        const sessionItems = sessions
          .map((s, i) => {
            const dt = formatDateTime(s.session_at);
            const note = s.note ? `（${s.note}）` : "";
            return `<li style="margin-bottom:2px;">${String(i + 1).padStart(2, "0")} · ${escapeHtml(dt)}${escapeHtml(note)}</li>`;
          })
          .join("\n              ");
        dateBlock = `
          <li><b>共 ${sessions.length} 堂</b></li>
          <li>
            <ol style="padding-left:18px;margin:6px 0 0;color:#444;">
              ${sessionItems}
            </ol>
          </li>`;
      }

      const lines: string[] = [
        `<li><b>類型：</b>${formatLabel}</li>`,
        dateBlock,
      ];
      if (course.schedule_note) lines.push(`<li><b>備註：</b>${escapeHtml(course.schedule_note)}</li>`);
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

// =========================================================
// admin action：對某課程的報名者廣播一封信
// 範例用途：課程成立通知、課前提醒、課程取消、補充資訊
// 支援變數：{name}（學員名字）、{course_title}（課程標題）
// =========================================================
export async function sendCourseEmail(courseId: string, formData: FormData) {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const subject = (formData.get("subject") as string | null)?.trim();
  const body = (formData.get("body") as string | null)?.trim();
  const includePending = formData.get("include_pending") === "1";
  const includeConfirmed = formData.get("include_confirmed") === "1";

  if (!subject) return { error: "請填寫主旨" };
  if (!body) return { error: "請填寫內容" };
  if (!includePending && !includeConfirmed) return { error: "請至少勾選一種對象" };
  if (subject.length > 200) return { error: "主旨過長（上限 200 字）" };
  if (body.length > 5000) return { error: "內容過長（上限 5000 字）" };

  const sb = serviceClient();
  const { data: course } = await sb
    .from("courses")
    .select("title")
    .eq("id", courseId)
    .single();
  if (!course) return { error: "找不到課程" };

  const statuses: string[] = [];
  if (includePending) statuses.push("pending");
  if (includeConfirmed) statuses.push("confirmed");

  const { data: regs } = await sb
    .from("registrations")
    .select("id, name, email")
    .eq("course_id", courseId)
    .in("status", statuses);

  if (!regs || regs.length === 0) return { error: "沒有符合條件的報名者" };

  const personalize = (text: string, name: string) =>
    text.replaceAll("{name}", name).replaceAll("{course_title}", course.title);

  // body 是純文字 + 換行；轉成 HTML 時保留換行（white-space: pre-wrap）
  const wrap = (plainBody: string) => `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1b18;line-height:1.75;">
      <div style="white-space:pre-wrap;font-size:15px;">${escapeHtml(plainBody)}</div>
    </div>
  `;

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const reg of regs) {
    const personalSubject = personalize(subject, reg.name);
    const personalBody = personalize(body, reg.name);
    const res = await sendEmail({
      to: reg.email,
      reply_to: TEACHER_EMAIL,
      subject: personalSubject,
      html: wrap(personalBody),
    });
    if ("error" in res) {
      failed++;
      errors.push(`${reg.email}: ${res.error}`);
    } else {
      sent++;
    }
  }

  if (failed > 0) console.error("[sendCourseEmail] failures:", errors);

  return { ok: true, sent, failed, total: regs.length };
}
