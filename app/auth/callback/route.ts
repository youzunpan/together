import { createServerClient } from "@supabase/ssr";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/feed";

  if (!code) return NextResponse.redirect(`${origin}/login`);

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) return NextResponse.redirect(`${origin}/login?error=auth`);

  const user = data.user;
  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 已有 profile → 直接進 app
  const { data: existingProfile } = await supabase
    .from("profiles").select("id").eq("id", user.id).single();

  if (existingProfile) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  // 首次登入：必須有 approved application
  const email = user.email?.toLowerCase();
  if (!email) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login?error=no-email`);
  }

  const { data: application } = await admin
    .from("applications").select("*")
    .ilike("email", email)
    .eq("status", "approved")
    .maybeSingle();

  if (!application) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login?error=unapproved`);
  }

  const display_name = application.display_name;
  const avatar_letter = display_name.charAt(0);
  const avatar_colors = ["purple", "teal", "coral", "blue", "amber", "pink"] as const;
  const avatar_color = avatar_colors[Math.floor(Math.random() * avatar_colors.length)];

  await admin.from("profiles").insert({
    id: user.id,
    display_name,
    avatar_letter,
    avatar_color,
  });

  return NextResponse.redirect(`${origin}${next}`);
}
