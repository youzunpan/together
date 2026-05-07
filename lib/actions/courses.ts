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

function parseInput(formData: FormData): { error?: string; data?: CourseInput } {
  const get = (k: string) => (formData.get(k) as string | null)?.trim() || null;
  const title = get("title");
  const start_at_local = get("start_at");
  const capacity = Number(get("capacity"));
  const format = get("format");
  const duration_type = get("duration_type");
  const status = get("status");

  if (!title) return { error: "請填標題" };
  if (!start_at_local) return { error: "請填開課時間" };
  if (!capacity || capacity < 1) return { error: "名額至少 1" };
  if (format !== "online" && format !== "offline") return { error: "課程類型錯誤" };
  if (duration_type !== "single" && duration_type !== "series") return { error: "課程長度錯誤" };
  if (status !== "draft" && status !== "published" && status !== "closed") return { error: "狀態錯誤" };

  const start_at = localToUtcIso(start_at_local);
  if (!start_at) return { error: "開課時間格式錯誤" };

  const end_at_local = get("end_at");
  const end_at = end_at_local ? localToUtcIso(end_at_local) : null;
  if (end_at_local && !end_at) return { error: "結束時間格式錯誤" };

  return {
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
  };
}

export async function createCourse(formData: FormData) {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const parsed = parseInput(formData);
  if (parsed.error || !parsed.data) return { error: parsed.error ?? "資料錯誤" };

  const slug = parsed.data.slug?.trim() || autoSlug(parsed.data.title);

  const sb = serviceClient();

  // slug 衝突自動加尾碼
  let finalSlug = slug;
  for (let i = 0; i < 5; i++) {
    const { data: existing } = await sb.from("courses").select("id").eq("slug", finalSlug).maybeSingle();
    if (!existing) break;
    finalSlug = `${slug}-${i + 2}`;
  }

  const { error } = await sb.from("courses").insert({
    ...parsed.data,
    slug: finalSlug,
    created_by: auth.user.id,
  });
  if (error) return { error: error.message };

  revalidatePath("/admin");
  revalidatePath("/courses");
  revalidatePath(`/courses/${finalSlug}`);
  return { ok: true };
}

export async function updateCourse(id: string, formData: FormData) {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const parsed = parseInput(formData);
  if (parsed.error || !parsed.data) return { error: parsed.error ?? "資料錯誤" };

  const sb = serviceClient();

  // 取舊 slug 用於 revalidate
  const { data: prev } = await sb.from("courses").select("slug").eq("id", id).single();

  const updateData = { ...parsed.data };
  if (!parsed.data.slug) delete updateData.slug; // 沒填就不動 slug

  const { error } = await sb.from("courses").update(updateData).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin");
  revalidatePath("/courses");
  if (prev?.slug) revalidatePath(`/courses/${prev.slug}`);
  if (parsed.data.slug && parsed.data.slug !== prev?.slug) {
    revalidatePath(`/courses/${parsed.data.slug}`);
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
