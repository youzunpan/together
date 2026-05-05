// 同心：列出未過期的呼喚（已開始、即將開始、未來 30 天內）。
// 過期判斷：scheduled_at + duration + 緩衝 30 分鐘 < now → 不顯示。

import { createClient } from "@/lib/supabase-server";
import Avatar from "@/components/Avatar";
import CreateCallForm from "@/app/feed/CreateCallForm";
import { JoinButton, CancelButton, AdminCancelButton } from "@/app/feed/CallActions";
import { APP_TZ } from "@/lib/tz";

type CallRow = {
  id: string;
  user_id: string;
  scheduled_at: string;
  duration_min: number;
  message: string | null;
  display_name: string;
  avatar_letter: string;
  avatar_color: string;
  avatar_url: string | null;
  join_count: number;
  joined_by_me: boolean;
};

type Joiner = {
  call_id: string;
  user_id: string;
  display_name: string;
  avatar_letter: string;
  avatar_color: string;
  avatar_url: string | null;
};

function formatWhen(scheduledAt: string): string {
  const sched = new Date(scheduledAt);
  const now = new Date();
  const diffMs = sched.getTime() - now.getTime();
  const diffMin = Math.round(diffMs / 60000);

  if (diffMin <= 0 && diffMin > -120) return "進行中";
  if (diffMin > 0 && diffMin < 60) return `${diffMin} 分鐘後`;
  if (diffMin >= 60 && diffMin < 60 * 6) {
    const h = Math.floor(diffMin / 60);
    const m = diffMin % 60;
    return m > 0 ? `${h}h ${m}m 後` : `${h} 小時後`;
  }
  // 顯示「今天 21:00 / 明天 09:30 / 4/27 09:30」
  const fmt = new Intl.DateTimeFormat("zh-TW", {
    timeZone: APP_TZ,
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts: Record<string, string> = {};
  for (const p of fmt.formatToParts(sched)) {
    if (p.type !== "literal") parts[p.type] = p.value;
  }
  // 判斷 today/tomorrow（用台北日 key）
  const tpeKey = (d: Date) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: APP_TZ, year: "numeric", month: "2-digit", day: "2-digit",
    }).format(d);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const schedKey = tpeKey(sched);
  const prefix =
    schedKey === tpeKey(now) ? "今天 " :
    schedKey === tpeKey(tomorrow) ? "明天 " :
    `${parts.month}/${parts.day} `;
  return `${prefix}${parts.hour}:${parts.minute}`;
}

export default async function UpcomingCalls() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // 是不是 admin → admin 對「不是自己發起」的呼喚也能強制刪
  const { data: viewerProfile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  const isAdmin = viewerProfile?.role === "admin";

  // 拉所有未過期的呼喚：scheduled_at > now() - 2.5h（涵蓋進行中 + 緩衝）
  const cutoff = new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString();
  const { data: calls } = await supabase
    .from("sit_calls_with_stats")
    .select("*")
    .gte("scheduled_at", cutoff)
    .order("scheduled_at", { ascending: true })
    .returns<CallRow[]>();

  // 進一步過濾：scheduled_at + duration + 30min 緩衝 < now → 過期，丟掉
  const now = Date.now();
  const live = (calls ?? []).filter((c) => {
    const endMs = new Date(c.scheduled_at).getTime() + (c.duration_min + 30) * 60 * 1000;
    return endMs > now;
  });

  // 拉每筆 call 前 5 位加入者頭像
  let joinersByCall = new Map<string, Joiner[]>();
  if (live.length > 0) {
    const ids = live.map((c) => c.id);
    const { data: joins } = await supabase
      .from("sit_call_joins")
      .select("call_id, user_id, profiles(display_name, avatar_letter, avatar_color, avatar_url)")
      .in("call_id", ids);
    if (joins) {
      for (const j of joins as unknown as Array<{
        call_id: string;
        user_id: string;
        profiles: { display_name: string; avatar_letter: string; avatar_color: string; avatar_url: string | null };
      }>) {
        const arr = joinersByCall.get(j.call_id) ?? [];
        arr.push({
          call_id: j.call_id,
          user_id: j.user_id,
          display_name: j.profiles.display_name,
          avatar_letter: j.profiles.avatar_letter,
          avatar_color: j.profiles.avatar_color,
          avatar_url: j.profiles.avatar_url,
        });
        joinersByCall.set(j.call_id, arr);
      }
    }
  }

  return (
    <section style={{ marginBottom: "1.5rem" }}>
      <div className="flex items-baseline justify-between mb-2 px-1">
        <p
          style={{
            fontFamily: "var(--font-space-mono)",
            fontSize: "0.6rem",
            letterSpacing: "0.2em",
            color: "rgba(237,236,234,0.3)",
          }}
        >
          同心 · UPCOMING
        </p>
        {live.length > 0 && (
          <p
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: "0.55rem",
              letterSpacing: "0.1em",
              color: "rgba(237,236,234,0.2)",
            }}
          >
            {live.length} {live.length === 1 ? "CALL" : "CALLS"}
          </p>
        )}
      </div>

      {live.length === 0 && (
        <p
          style={{
            fontSize: "0.78rem",
            color: "rgba(237,236,234,0.35)",
            lineHeight: 1.6,
            marginBottom: "0.75rem",
            paddingLeft: "0.25rem",
          }}
        >
          還沒有同心邀坐。約一個時間，呼喚別人一起。
        </p>
      )}

      <div className="space-y-2 mb-3">
        {live.map((c) => {
          const sched = new Date(c.scheduled_at);
          const endMs = sched.getTime() + c.duration_min * 60 * 1000;
          const isLive = sched.getTime() <= now && now < endMs;
          const isOwner = c.user_id === user.id;
          const whenLabel = formatWhen(c.scheduled_at);
          const joiners = (joinersByCall.get(c.id) ?? []).slice(0, 5);

          return (
            <div
              key={c.id}
              style={{
                background: "#2c2c2a",
                border: isLive ? "1px solid rgba(190,194,63,0.5)" : "1px solid rgba(255,255,255,0.06)",
                borderRadius: "var(--r-card)",
                padding: "0.875rem 1rem",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* 進行中：左上小金點 */}
              {isLive && (
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#BEC23F",
                    animation: "callPulse 6s ease-in-out infinite",
                  }}
                />
              )}

              {/* 發起人 + 時間 */}
              <div className="flex items-center gap-2 mb-2">
                <Avatar
                  letter={c.avatar_letter}
                  color={c.avatar_color}
                  avatarUrl={c.avatar_url}
                  size={26}
                />
                <div className="min-w-0 flex-1">
                  <p
                    style={{
                      fontSize: "0.82rem",
                      color: "#edecea",
                      lineHeight: 1.2,
                    }}
                    className="truncate"
                  >
                    {c.display_name}
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-space-mono)",
                      fontSize: "0.62rem",
                      letterSpacing: "0.1em",
                      color: isLive ? "#BEC23F" : "rgba(237,236,234,0.45)",
                      marginTop: "0.1rem",
                    }}
                  >
                    {whenLabel} · {c.duration_min}min
                  </p>
                </div>
              </div>

              {/* 訊息 */}
              {c.message && (
                <p
                  className="reflection-text"
                  style={{
                    fontSize: "0.85rem",
                    color: "rgba(237,236,234,0.75)",
                    lineHeight: 1.55,
                    marginBottom: "0.625rem",
                  }}
                >
                  「{c.message}」
                </p>
              )}

              {/* 加入頭像疊圈 + 動作 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex" style={{ marginLeft: joiners.length > 0 ? 4 : 0 }}>
                    {joiners.map((j, i) => (
                      <div
                        key={j.user_id}
                        style={{
                          marginLeft: i === 0 ? -4 : -8,
                          border: "2px solid #2c2c2a",
                          borderRadius: "50%",
                          zIndex: joiners.length - i,
                        }}
                      >
                        <Avatar
                          letter={j.avatar_letter}
                          color={j.avatar_color}
                          avatarUrl={j.avatar_url}
                          size={22}
                        />
                      </div>
                    ))}
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-space-mono)",
                      fontSize: "0.62rem",
                      letterSpacing: "0.1em",
                      color: "rgba(237,236,234,0.4)",
                    }}
                  >
                    {Number(c.join_count)} {Number(c.join_count) === 1 ? "PERSON" : "PEOPLE"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {isOwner && <CancelButton callId={c.id} />}
                  {!isOwner && isAdmin && <AdminCancelButton callId={c.id} />}
                  <JoinButton
                    callId={c.id}
                    joined={Boolean(c.joined_by_me)}
                    isLive={isLive}
                    durationMin={c.duration_min}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <CreateCallForm />

      <style>{`
        @keyframes callPulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50%      { opacity: 1;   transform: scale(1.4); }
        }
      `}</style>
    </section>
  );
}
