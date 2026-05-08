"use server";

// admin CRUD：新增、更新、改狀態、刪除課程

import { createClient } from "@/lib/supabase-server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

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

// 由標題自動生成 slug：英文/數字保留、其他字元用 hash 衍生
// e.g. "五月冥想初階班" → "course-{nanoid}"
//      "May Basic 2026" → "may-basic-2026"
function autoSlug(title: string): string {
  const ascii = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\x00-\x7f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (ascii.length >= 3) return ascii;
  // 沒有可用 ASCII 字元（純中文標題）→ 用時間戳
  return `course-${Date.now().toString(36)}`;
}

type CourseInput = {
  slug?: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  format: "online" | "offline";
  duration_type: "single" | "series";
  start_at: string;          // datetime-local "YYYY-MM-DDTHH:mm"（台北時區）
  end_at?: string | null;
  schedule_note?: string | null;
  location?: string | null;
  price_note?: string | null;
  capacity: number;
  cover_image_url?: string | null;
  status: "draft" | "published" | "closed";
};

// 把 input 的 datetime-local（台北牆上時間）轉成 UTC ISO
// "2026-05-12T19:30" → 視為 +08:00 → toISOString
function localToUtcIso(local: string | null | undefined): string | null {
  if (!local) return null;
  // datetime-local 沒有時區資訊；強制當 +08:00 解讀
  const iso = `${local}:00+08:00`;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

type SessionInput = {
  session_at_local: string; // "YYYY-MM-DDTHH:mm" 台北牆上時間
  duration_min?: number | null;
  note?: string | null;
};

type ParsedInput = {
  data: CourseInput;
  sessions: { session_at: string; duration_min: number | null; note: string | null }[];
};

function parseInput(formData: FormData): { error?: string; parsed?: ParsedInput } {
  const get = (k: string) => (formData.get(k) as string | null)?.trim() || null;
  const title = get("title");
  const capacity = Number(get("capacity"));
  const format = get("format");
  const duration_type = get("duration_type");
  const status = get("status");

  if (!title) return { error: "請填標題" };
  if (!capacity || capacity < 1) return { error: "名額至少 1" };
  if (format !== "online" && format !== "offline") return { error: "課程類型錯誤" };
  if (duration_type !== "single" && duration_type !== "series") return { error: "課程長度錯誤" };
  if (status !== "draft" && status !== "published" && status !== "closed") return { error: "狀態錯誤" };

  // 解析 sessions（必填，至少 1 場）
  const sessionsRaw = formData.get("sessions_json") as string | null;
  let sessionsInput: SessionInput[] = [];
  try {
    sessionsInput = sessionsRaw ? JSON.parse(sessionsRaw) : [];
  } catch {
    return { error: "上課日期格式錯誤" };
  }
  if (!Array.isArray(sessionsInput) || sessionsInput.length === 0) {
    return { error: "請至少加 1 個上課日期" };
  }

  const sessions = sessionsInput.map((s) => {
    const iso = localToUtcIso(s.session_at_local);
    if (!iso) throw new Error(`日期格式錯誤：${s.session_at_local}`);
    return {
      session_at: iso,
      duration_min: s.duration_min ?? null,
      note: s.note?.trim() || null,
    };
  });

  // 排序：依時間升冪
  sessions.sort((a, b) => a.session_at.localeCompare(b.session_at));

  // 由 sessions 推導 courses.start_at / end_at
  const start_at = sessions[0].session_at;
  const end_at = sessions.length > 1 ? sessions[sessions.length - 1].session_at : null;

  return {
    parsed: {
      data: {
        slug: get("slug") || undefined,
        title,
        subtitle: get("subtitle"),
        description: get("description") ?? "",
        format,
        duration_type,
        start_at,
        end_at,
        schedule_note: get("schedule_note"),
        location: get("location"),
        price_note: get("price_note"),
        capacity,
        cover_image_url: get("cover_image_url"),
        status,
      },
      sessions,
    },
  };
}

async function replaceSessions(
  sb: ReturnType<typeof serviceClient>,
  courseId: string,
  sessions: { session_at: string; duration_min: number | null; note: string | null }[],
) {
  await sb.from("course_sessions").delete().eq("course_id", courseId);
  if (sessions.length > 0) {
    const rows = sessions.map((s) => ({
      course_id: courseId,
      session_at: s.session_at,
      duration_min: s.duration_min,
      note: s.note,
    }));
    const { error } = await sb.from("course_sessions").insert(rows);
    if (error) throw new Error(`寫入 sessions 失敗：${error.message}`);
  }
}

export async function createCourse(formData: FormData) {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const parsed = parseInput(formData);
  if (parsed.error || !parsed.parsed) return { error: parsed.error ?? "資料錯誤" };
  const { data, sessions } = parsed.parsed;

  const slug = data.slug?.trim() || autoSlug(data.title);

  const sb = serviceClient();

  // slug 衝突自動加尾碼
  let finalSlug = slug;
  for (let i = 0; i < 5; i++) {
    const { data: existing } = await sb.from("courses").select("id").eq("slug", finalSlug).maybeSingle();
    if (!existing) break;
    finalSlug = `${slug}-${i + 2}`;
  }

  const { data: inserted, error } = await sb
    .from("courses")
    .insert({ ...data, slug: finalSlug, created_by: auth.user.id })
    .select("id")
    .single();
  if (error || !inserted) return { error: error?.message ?? "建立失敗" };

  try {
    await replaceSessions(sb, inserted.id, sessions);
  } catch (e) {
    // 寫 sessions 失敗 → 回滾課程
    await sb.from("courses").delete().eq("id", inserted.id);
    return { error: e instanceof Error ? e.message : "寫入 sessions 失敗" };
  }

  revalidatePath("/admin");
  revalidatePath("/courses");
  revalidatePath(`/courses/${finalSlug}`);
  return { ok: true };
}

export async function updateCourse(id: string, formData: FormData) {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const parsed = parseInput(formData);
  if (parsed.error || !parsed.parsed) return { error: parsed.error ?? "資料錯誤" };
  const { data, sessions } = parsed.parsed;

  const sb = serviceClient();

  // 取舊 slug 用於 revalidate
  const { data: prev } = await sb.from("courses").select("slug").eq("id", id).single();

  const updateData = { ...data };
  if (!data.slug) delete updateData.slug; // 沒填就不動 slug

  const { error } = await sb.from("courses").update(updateData).eq("id", id);
  if (error) return { error: error.message };

  try {
    await replaceSessions(sb, id, sessions);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "更新 sessions 失敗" };
  }

  revalidatePath("/admin");
  revalidatePath("/courses");
  if (prev?.slug) revalidatePath(`/courses/${prev.slug}`);
  if (data.slug && data.slug !== prev?.slug) {
    revalidatePath(`/courses/${data.slug}`);
  }
  return { ok: true };
}

export async function deleteCourse(id: string) {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const sb = serviceClient();
  const { data: prev } = await sb.from("courses").select("slug").eq("id", id).single();

  const { error } = await sb.from("courses").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin");
  revalidatePath("/courses");
  if (prev?.slug) revalidatePath(`/courses/${prev.slug}`);
  return { ok: true };
}

export async function setCourseStatus(
  id: string,
  status: "draft" | "published" | "closed",
) {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const sb = serviceClient();
  const { data: prev } = await sb.from("courses").select("slug").eq("id", id).single();

  const { error } = await sb.from("courses").update({ status }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin");
  revalidatePath("/courses");
  if (prev?.slug) revalidatePath(`/courses/${prev.slug}`);
  return { ok: true };
}
