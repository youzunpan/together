"use server";

import { createClient } from "@/lib/supabase-server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { sendEmail } from "@/lib/email";

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "未登入" as const };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") return { error: "無權限" as const };
  return { user, supabase };
}

export async function submitApplication(formData: FormData) {
  const email = (formData.get("email") as string | null)?.trim().toLowerCase();
  const display_name = (formData.get("display_name") as string | null)?.trim();
  const note = (formData.get("note") as string | null)?.trim() || null;
  const password = formData.get("password") as string | null;

  if (!email || !display_name) return { error: "請填寫 email 和顯示名稱" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "email 格式不正確" };
  if (display_name.length > 40) return { error: "顯示名稱過長" };
  if (note && note.length > 200) return { error: "自介過長（上限 200 字）" };
  if (!password || password.length < 6) return { error: "密碼至少 6 個字" };

  const admin = serviceClient();

  const { error } = await admin
    .from("applications")
    .insert({ email, display_name, note, password });

  if (error) {
    if (error.code === "23505") return { error: "這個 email 已經申請過了。" };
    return { error: error.message };
  }

  return { ok: true };
}

export async function approveApplication(id: string) {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const admin = serviceClient();
  const { data: application, error: fetchErr } = await admin
    .from("applications").select("*").eq("id", id).single();
  if (fetchErr || !application) return { error: "找不到申請" };
  if (application.status !== "pending") return { error: "已經處理過了" };
  if (!application.password) return { error: "此申請沒有密碼（舊資料）" };

  // 直接建 auth user（Supabase 會 hash 密碼）
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: application.email,
    password: application.password,
    email_confirm: true,
  });
  if (createErr || !created.user) return { error: `建立帳號失敗：${createErr?.message ?? "unknown"}` };

  // 建 profile
  const avatar_colors = ["purple", "teal", "coral", "blue", "amber", "pink"] as const;
  const { error: profileErr } = await admin.from("profiles").insert({
    id: created.user.id,
    display_name: application.display_name,
    avatar_letter: application.display_name.charAt(0),
    avatar_color: avatar_colors[Math.floor(Math.random() * avatar_colors.length)],
  });
  if (profileErr) return { error: `建立 profile 失敗：${profileErr.message}` };

  // 標記已通過，清掉密碼
  await admin.from("applications").update({
    status: "approved",
    reviewed_by: auth.user.id,
    reviewed_at: new Date().toISOString(),
    password: null,
  }).eq("id", id);

  // 寄通知信（未設定 RESEND_API_KEY 會自動略過）
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  const origin = host ? `${proto}://${host}` : "";
  await sendEmail({
    to: application.email,
    subject: "同在 · 你的申請已通過",
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1a1b18;">
        <h2 style="font-weight:normal;">${application.display_name}，歡迎來到同在。</h2>
        <p>你的申請已通過審核。</p>
        <p>現在可以用你申請時填的 email 和密碼登入：</p>
        <p><a href="${origin}/login" style="color:#6d7220;">${origin}/login</a></p>
        <p style="color:#888;font-size:12px;margin-top:32px;">一起靜坐的地方。</p>
      </div>
    `,
  });

  revalidatePath("/admin");
  return { ok: true };
}

export async function rejectApplication(id: string) {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const admin = serviceClient();
  const { error } = await admin.from("applications").update({
    status: "rejected",
    reviewed_by: auth.user.id,
    reviewed_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { ok: true };
}

export async function deleteApplication(id: string) {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const admin = serviceClient();
  const { error } = await admin.from("applications").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { ok: true };
}
