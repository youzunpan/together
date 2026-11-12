import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// 這支只跑在需要登入的路徑上（見下面的 matcher）。
//
// 原本的 matcher 是「排除靜態檔，其餘全跑」，等於公開頁（/、/courses、/terms、
// /login）、每個 /api/* 路由、manifest、service worker、還有 Next 的每一次
// prefetch 都會進來跑一次 auth.getUser() —— 而 getUser() 是一趟網路請求打
// Supabase Auth，Auth 每次都去讀 auth.users。那些路徑本來就不在保護清單裡，
// 查了也不會用到結果，純粹白燒 Disk IO。
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 用 getClaims 而不是 getUser：本專案的 JWT 是 ES256 非對稱簽章
  // （/auth/v1/.well-known/jwks.json 回 kty: EC），所以驗章能在本機用
  // WebCrypto 做完，不發請求、也就不會讀 auth.users。getUser() 則是每次必發。
  //
  // 安全性沒有降低 —— getClaims 是真的驗簽章，不是只解開 cookie 看看。
  // auth-js 自己的文件就把 getClaims 和 getUser 並列為建立身分的正確做法。
  // 快要過期的 token 它也會先 refresh 再驗，所以 cookie 續期照舊。
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims ?? null;

  const { pathname } = request.nextUrl;

  // matcher 已經只留保護路徑，所以進到這裡就是需要登入
  if (!claims) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Admin 保護（只有 /admin 會查這一下，量很小）
  if (pathname.startsWith("/admin")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", claims.sub)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.rewrite(new URL("/404", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  // 只列需要登入的路徑。兩種寫法都列是為了明確：`/me/:path*` 理論上也吃得到
  // 裸 `/me`，但不想靠這件事。公開頁不經過 proxy —— 它們的 auth 判斷本來就在
  // 各自的 page 裡做（而且多半根本不需要）。
  matcher: [
    "/feed",
    "/feed/:path*",
    "/sit",
    "/sit/:path*",
    "/me",
    "/me/:path*",
    "/u",
    "/u/:path*",
    "/admin",
    "/admin/:path*",
  ],
};
