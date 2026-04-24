"use client";

import { useState, useTransition } from "react";
import { updateProfile, signOut, setPassword } from "@/lib/actions/profile";
import { useRouter } from "next/navigation";

const COLORS = ["purple", "teal", "coral", "blue", "amber", "pink"] as const;

const inputStyle: React.CSSProperties = {
  width: "100%", background: "#5C677D", border: "1px solid rgba(255,255,255,0.08)",
  padding: "0.75rem 1rem", fontSize: "0.875rem", color: "#edecea", outline: "none",
};

type Props = { email: string; display_name: string; avatar_letter: string; avatar_color: string };

export default function SettingsForm({ email, display_name: initName, avatar_letter: initLetter, avatar_color: initColor }: Props) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initName);
  const [avatarLetter, setAvatarLetter] = useState(initLetter);
  const [color, setColor] = useState(initColor);
  const [saving, start] = useTransition();
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [pwSaving, startPw] = useTransition();
  const [pwToast, setPwToast] = useState<{ msg: string; ok: boolean } | null>(null);

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    setPwToast(null);
    startPw(async () => {
      const fd = new FormData();
      fd.set("password", pw);
      fd.set("confirm", pw2);
      const res = await setPassword(fd);
      if (res.error) setPwToast({ msg: res.error, ok: false });
      else { setPwToast({ msg: "密碼已設定", ok: true }); setPw(""); setPw2(""); }
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setToast(null);
    start(async () => {
      const fd = new FormData();
      fd.set("display_name", displayName);
      fd.set("avatar_letter", avatarLetter);
      fd.set("avatar_color", color);
      const res = await updateProfile(fd);
      if (res.error) setToast({ msg: res.error, ok: false });
      else { setToast({ msg: "已儲存", ok: true }); router.refresh(); }
    });
  }

  async function handleLogout() {
    if (!confirm("確定要登出？")) return;
    await signOut();
  }

  return (
    <div className="space-y-6">
    <form onSubmit={handleSave} className="space-y-6">
      {/* Email (唯讀) */}
      <div>
        <label className="seq-label block mb-1.5">EMAIL</label>
        <p style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.8rem", color: "rgba(237,236,234,0.5)", padding: "0.75rem 1rem", background: "#001233", border: "1px solid rgba(255,255,255,0.04)" }}>
          {email}
        </p>
      </div>

      {/* 顯示名稱 */}
      <div>
        <label className="seq-label block mb-1.5">顯示名稱</label>
        <input value={displayName} onChange={e => setDisplayName(e.target.value)} maxLength={40} required
          style={inputStyle}
          onFocus={e => e.target.style.borderColor = "#BEC23F"}
          onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"} />
      </div>

      {/* 頭像字 */}
      <div>
        <label className="seq-label block mb-1.5">頭像字（1–2 個）</label>
        <input value={avatarLetter} onChange={e => setAvatarLetter(e.target.value)} maxLength={2} required
          style={{ ...inputStyle, textAlign: "center", fontSize: "1.1rem", letterSpacing: "0.1em" }}
          onFocus={e => e.target.style.borderColor = "#BEC23F"}
          onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"} />
      </div>

      {/* 頭像顏色 */}
      <div>
        <label className="seq-label block mb-2">頭像底色</label>
        <div className="grid grid-cols-6 gap-2">
          {COLORS.map(c => (
            <button key={c} type="button" onClick={() => setColor(c)}
              className={`avatar-${c} flex items-center justify-center font-medium`}
              style={{
                aspectRatio: "1 / 1", fontSize: "0.9rem", cursor: "pointer", border: "none",
                outline: color === c ? "2px solid #BEC23F" : "none", outlineOffset: "2px",
                transition: "outline 0.1s",
              }}>
              {avatarLetter || "?"}
            </button>
          ))}
        </div>
      </div>

      {toast && (
        <p style={{ fontSize: "0.75rem", color: toast.ok ? "#BEC23F" : "#D65C6A", textAlign: "center" }}>
          {toast.msg}
        </p>
      )}

      <button type="submit" disabled={saving} className="btn-primary w-full"
        style={{ width: "100%", letterSpacing: "0.12em" }}>
        {saving ? "SAVING..." : "儲存"}
      </button>
    </form>

    {/* 密碼設定 */}
    <form onSubmit={handleSetPassword} className="space-y-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1.5rem" }}>
      <label className="seq-label block mb-1.5">設定 / 變更密碼</label>
      <input type="password" value={pw} onChange={e => setPw(e.target.value)}
        placeholder="新密碼（至少 6 字）" autoComplete="new-password" style={inputStyle}
        onFocus={e => e.target.style.borderColor = "#BEC23F"}
        onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"} />
      <input type="password" value={pw2} onChange={e => setPw2(e.target.value)}
        placeholder="再次輸入" autoComplete="new-password" style={inputStyle}
        onFocus={e => e.target.style.borderColor = "#BEC23F"}
        onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"} />
      {pwToast && (
        <p style={{ fontSize: "0.75rem", color: pwToast.ok ? "#BEC23F" : "#D65C6A", textAlign: "center" }}>
          {pwToast.msg}
        </p>
      )}
      <button type="submit" disabled={pwSaving || !pw || !pw2} className="btn-primary w-full"
        style={{ width: "100%", letterSpacing: "0.12em" }}>
        {pwSaving ? "..." : "設定密碼"}
      </button>
      <p style={{ fontSize: "0.7rem", color: "rgba(237,236,234,0.35)", textAlign: "center" }}>
        設定後即可用 email + 密碼登入。
      </p>
    </form>

    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1.5rem" }}>
      <button type="button" onClick={handleLogout}
        style={{
          width: "100%", background: "transparent", border: "1px solid rgba(214,92,106,0.3)",
          color: "rgba(214,92,106,0.9)", padding: "0.75rem", fontFamily: "var(--font-space-mono)",
          fontSize: "0.75rem", letterSpacing: "0.12em", cursor: "pointer",
        }}>
        登出
      </button>
    </div>
    </div>
  );
}
