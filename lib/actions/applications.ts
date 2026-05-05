"use server";

import { createClient } from "@/lib/supabase-server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { sendEmail } from "@/lib/email";
import { sendPushToUser } from "@/lib/web-push";

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

  if (!email || !display_name) return { error: "請填寫 email 和顯示名稱" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "email 格式不正確" };
  if (display_name.length > 40) return { error: "顯示名稱過長" };
  if (note && note.length > 200) return { error: "自介過長（上限 200 字）" };

  const admin = serviceClient();

  // 不再收密碼：通過審核後寄 magic link，使用者點開直接登入。
  const { error } = await admin
    .from("applications")
    .insert({ email, display_name, note });

  if (error) {
    if (error.code === "23505") return { error: "這個 email 已經申請過了。" };
    return { error: error.message };
  }

  // 通知所有 admin（推播失敗不影響申請成立）
  try {
    const { data: admins } = await admin
      .from("profiles")
      .select("id")
      .eq("role", "admin")
      .returns<{ id: string }[]>();
    if (admins?.length) {
      await Promise.all(
        admins.map((a) =>
          sendPushToUser(a.id, {
            title: "新成員申請",
            body: `${display_name}（${email}）申請加入同在`,
            url: "/admin",
            tag: `apply-${email}`,
            renotify: true,
          }).catch((e) => console.error("[applications] push failed", e)),
        ),
      );
    }
  } catch (e) {
    console.error("[applications] notify admins failed", e);
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

  // 建 auth user（無密碼，使用者第一次用 magic link 登入，之後可自行設密碼）
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: application.email,
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

  // 標記已通過；同時清掉舊資料殘留的密碼欄
  await admin.from("applications").update({
    status: "approved",
    reviewed_by: auth.user.id,
    reviewed_at: new Date().toISOString(),
    password: null,
  }).eq("id", id);

  // 取站台 origin
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  const origin = host ? `${proto}://${host}` : "";

  // 產 magic link（一次性登入連結）
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: application.email,
    options: { redirectTo: `${origin}/auth/callback?next=/feed` },
  });
  if (linkErr || !linkData?.properties?.action_link) {
    return { error: `產生登入連結失敗：${linkErr?.message ?? "unknown"}` };
  }

  // 寄通知信（含登入連結）
  await sendEmail({
    to: application.email,
    subject: "同在 · 你的申請已通過",
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1a1b18;">
        <h2 style="font-weight:normal;">${application.display_name}，歡迎來到同在。</h2>
        <p>你的申請已通過審核。點下面的按鈕直接進入：</p>
        <p style="margin:24px 0;">
          <a href="${linkData.properties.action_link}" style="display:inline-block;background:#BEC23F;color:#1a1b18;padding:12px 24px;text-decoration:none;border-radius:4px;font-weight:500;">進入同在</a>
        </p>
        <p style="color:#888;font-size:13px;line-height:1.5;">這個連結只能用一次。登入後可以在「設定」裡建立密碼，之後就可以用 email + 密碼登入。</p>
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
