"use client";

import { useState, useTransition } from "react";
import {
  deleteCourse,
  setCourseStatus,
} from "@/lib/actions/courses";
import {
  deleteRegistration,
  updateRegistrationStatus,
} from "@/lib/actions/registrations";
import CourseFormDialog, { type CourseFormCourse } from "./CourseFormDialog";
import CourseEmailDialog from "./CourseEmailDialog";

export type CourseRow = CourseFormCourse & {
  registered_count: number;
  seats_left: number;
};

export type RegistrationRow = {
  id: string;
  course_id: string;
  name: string;
  email: string;
  phone: string | null;
  line_id: string | null;
  transfer_last4: string | null;
  status: "pending" | "confirmed" | "cancelled";
  created_at: string;
  session_ids: string[] | null;
};

const STATUS_STYLE: Record<CourseRow["status"], { label: string; color: string }> = {
  draft:     { label: "DRAFT",     color: "rgba(237,236,234,0.4)" },
  published: { label: "PUBLISHED", color: "#BEC23F" },
  closed:    { label: "CLOSED",    color: "rgba(214,92,106,0.7)" },
};

const REG_STATUS_STYLE: Record<RegistrationRow["status"], { label: string; color: string }> = {
  pending:   { label: "PENDING",   color: "#BEC23F" },
  confirmed: { label: "CONFIRMED", color: "rgba(190,194,63,0.5)" },
  cancelled: { label: "CANCELLED", color: "rgba(214,92,106,0.7)" },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("zh-TW", {
    timeZone: "Asia/Taipei",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDateRange(c: CourseRow): string {
  const start = new Date(c.start_at).toLocaleString("zh-TW", { timeZone: "Asia/Taipei", month: "numeric", day: "numeric" });
  if (c.duration_type === "series" && c.end_at) {
    const end = new Date(c.end_at).toLocaleString("zh-TW", { timeZone: "Asia/Taipei", month: "numeric", day: "numeric" });
    return `${start} – ${end}`;
  }
  const time = new Date(c.start_at).toLocaleString("zh-TW", { timeZone: "Asia/Taipei", hour: "2-digit", minute: "2-digit", hour12: false });
  return `${start} ${time}`;
}

export default function CoursesTab({
  courses,
  registrations,
}: {
  courses: CourseRow[];
  registrations: RegistrationRow[];
}) {
  const [filter, setFilter] = useState<"all" | "published" | "draft" | "closed">("all");
  const [editing, setEditing] = useState<CourseRow | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [emailing, setEmailing] = useState<CourseRow | null>(null);
  const [pending, start] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  const list = filter === "all" ? courses : courses.filter(c => c.status === filter);

  function run(id: string, fn: () => Promise<{ error?: string; ok?: boolean }>) {
    setBusyId(id);
    start(async () => {
      const res = await fn();
      setBusyId(null);
      if (res.error) alert(res.error);
    });
  }

  const filterButtons: { value: typeof filter; label: string }[] = [
    { value: "all", label: "全部" },
    { value: "published", label: "公開" },
    { value: "draft", label: "草稿" },
    { value: "closed", label: "已截止" },
  ];

  return (
    <div>
      {/* 新增 + 篩選 */}
      <div className="flex flex-col gap-3 mb-4">
        <button
          onClick={() => setShowNew(true)}
          className="btn-primary"
          style={{ width: "100%", padding: "0.65rem", letterSpacing: "0.12em", fontSize: "0.75rem" }}
        >
          + 新增課程
        </button>

        <div className="flex gap-1" style={{ background: "#2c2c2a", padding: "2px", borderRadius: 4 }}>
          {filterButtons.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              style={{
                flex: 1,
                padding: "0.5rem 0.25rem",
                fontFamily: "var(--font-space-mono)",
                fontSize: "0.6rem",
                letterSpacing: "0.1em",
                border: "none",
                cursor: "pointer",
                borderRadius: 3,
                background: filter === f.value ? "#BEC23F" : "transparent",
                color: filter === f.value ? "#1a1b18" : "rgba(237,236,234,0.4)",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 列表 */}
      {list.length === 0 ? (
        <p style={{ fontSize: "0.875rem", color: "rgba(237,236,234,0.2)", textAlign: "center", padding: "3rem 0" }}>
          {courses.length === 0 ? "還沒有任何課程。" : "這個分類沒有課程。"}
        </p>
      ) : (
        <div className="space-y-px" style={{ borderRadius: "var(--r-card)", overflow: "hidden" }}>
          {list.map(c => {
            const status = STATUS_STYLE[c.status];
            const expanded = expandedId === c.id;
            const courseRegs = registrations.filter(r => r.course_id === c.id);
            return (
              <div key={c.id} style={{ background: "#2c2c2a", borderBottom: "1px solid rgba(255,255,255,0.04)", padding: "1rem" }}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: "0.95rem", color: "#edecea", fontFamily: "var(--font-noto-serif)" }}>{c.title}</p>
                    {c.subtitle && (
                      <p style={{ fontSize: "0.75rem", color: "rgba(237,236,234,0.5)", marginTop: "0.2rem", lineHeight: 1.4 }}>
                        {c.subtitle}
                      </p>
                    )}
                  </div>
                  <span style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", letterSpacing: "0.08em", color: status.color, flexShrink: 0 }}>
                    {status.label}
                  </span>
                </div>

                <p style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", color: "rgba(237,236,234,0.45)", letterSpacing: "0.06em", marginBottom: "0.75rem" }}>
                  {c.format === "online" ? "線上" : "實體"} · {c.duration_type === "series" ? "長期" : "單次"} · {formatDateRange(c)}
                </p>

                <p style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.65rem", color: "rgba(237,236,234,0.6)", marginBottom: "0.75rem" }}>
                  <span style={{ color: c.seats_left <= 0 ? "#D65C6A" : "#BEC23F" }}>
                    {c.seats_left <= 0 ? "已額滿" : `餘 ${c.seats_left} / ${c.capacity}`}
                  </span>
                  <span style={{ color: "rgba(237,236,234,0.3)", margin: "0 0.5rem" }}>·</span>
                  <span>{c.registered_count} 人報名</span>
                </p>

                <div className="flex flex-wrap gap-1.5">
                  <ActionButton onClick={() => setEditing(c)}>編輯</ActionButton>
                  <ActionButton onClick={() => setExpandedId(expanded ? null : c.id)}>
                    {expanded ? "收起" : `報名 (${c.registered_count})`}
                  </ActionButton>
                  {c.registered_count > 0 && (
                    <ActionButton onClick={() => setEmailing(c)}>
                      ✉ 寄信
                    </ActionButton>
                  )}
                  {c.status !== "published" && (
                    <ActionButton
                      disabled={busyId === c.id && pending}
                      onClick={() => run(c.id, () => setCourseStatus(c.id, "published"))}
                    >
                      公開
                    </ActionButton>
                  )}
                  {c.status === "published" && (
                    <ActionButton
                      disabled={busyId === c.id && pending}
                      onClick={() => run(c.id, () => setCourseStatus(c.id, "closed"))}
                    >
                      截止
                    </ActionButton>
                  )}
                  {c.status === "closed" && (
                    <ActionButton
                      disabled={busyId === c.id && pending}
                      onClick={() => run(c.id, () => setCourseStatus(c.id, "draft"))}
                    >
                      退回草稿
                    </ActionButton>
                  )}
                  <ActionButton
                    danger
                    disabled={busyId === c.id && pending}
                    onClick={() => {
                      if (confirm(`刪除「${c.title}」？\n所有報名紀錄會一併刪除，無法復原。`)) {
                        run(c.id, () => deleteCourse(c.id));
                      }
                    }}
                  >
                    刪除
                  </ActionButton>
                </div>

                {expanded && (
                  <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <p style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", letterSpacing: "0.12em", color: "rgba(237,236,234,0.4)", marginBottom: "0.75rem" }}>
                      報名名單 · {courseRegs.length}
                    </p>
                    {courseRegs.length === 0 ? (
                      <p style={{ fontSize: "0.8rem", color: "rgba(237,236,234,0.3)", textAlign: "center", padding: "1rem 0" }}>
                        還沒有報名
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {courseRegs.map(r => (
                          <RegistrationItem key={r.id} reg={r} pending={pending} busyId={busyId} run={run} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* dialog */}
      {showNew && (
        <CourseFormDialog
          open={showNew}
          onOpenChange={setShowNew}
          course={null}
        />
      )}
      {editing && (
        <CourseFormDialog
          open={!!editing}
          onOpenChange={(open) => { if (!open) setEditing(null); }}
          course={editing}
        />
      )}
      {emailing && (
        <CourseEmailDialog
          open={!!emailing}
          onOpenChange={(open) => { if (!open) setEmailing(null); }}
          course={emailing}
          pendingCount={registrations.filter(r => r.course_id === emailing.id && r.status === "pending").length}
          confirmedCount={registrations.filter(r => r.course_id === emailing.id && r.status === "confirmed").length}
        />
      )}
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        background: "transparent",
        border: `1px solid ${danger ? "rgba(214,92,106,0.4)" : "rgba(255,255,255,0.1)"}`,
        color: danger ? "rgba(214,92,106,0.85)" : "rgba(237,236,234,0.6)",
        padding: "0.35rem 0.7rem",
        fontFamily: "var(--font-space-mono)",
        fontSize: "0.62rem",
        letterSpacing: "0.08em",
        cursor: disabled ? "default" : "pointer",
        borderRadius: 3,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  );
}

function RegistrationItem({
  reg,
  pending,
  busyId,
  run,
}: {
  reg: RegistrationRow;
  pending: boolean;
  busyId: string | null;
  run: (id: string, fn: () => Promise<{ error?: string; ok?: boolean }>) => void;
}) {
  const status = REG_STATUS_STYLE[reg.status];
  const isBusy = busyId === reg.id && pending;
  return (
    <div style={{ background: "rgba(0,0,0,0.2)", padding: "0.65rem 0.75rem", borderRadius: 4 }}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2" style={{ marginBottom: "0.1rem" }}>
            <p style={{ fontSize: "0.85rem", color: "#edecea" }}>{reg.name}</p>
            <span style={{
              fontFamily: "var(--font-space-mono)", fontSize: "0.55rem",
              letterSpacing: "0.08em", color: "rgba(190,194,63,0.7)",
              border: "1px solid rgba(190,194,63,0.3)", borderRadius: 2,
              padding: "0.05rem 0.35rem",
            }}>
              {reg.session_ids && reg.session_ids.length > 0
                ? `單堂 × ${reg.session_ids.length}`
                : "整期"}
            </span>
          </div>
          <p style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.65rem", color: "rgba(237,236,234,0.4)", marginTop: "0.15rem", wordBreak: "break-all" }}>
            {reg.email}
          </p>
          {(reg.line_id || reg.transfer_last4 || reg.phone) && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.25rem", fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", color: "rgba(237,236,234,0.4)" }}>
              {reg.line_id && <span>LINE · {reg.line_id}</span>}
              {reg.transfer_last4 && <span style={{ color: "#BEC23F" }}>匯款 · {reg.transfer_last4}</span>}
              {reg.phone && <span>TEL · {reg.phone}</span>}
            </div>
          )}
        </div>
        <span style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.55rem", letterSpacing: "0.08em", color: status.color, flexShrink: 0 }}>
          {status.label}
        </span>
      </div>
      <div className="flex items-center justify-between" style={{ marginTop: "0.5rem" }}>
        <span style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.55rem", color: "rgba(237,236,234,0.3)", letterSpacing: "0.06em" }}>
          {formatDate(reg.created_at)}
        </span>
        <div className="flex gap-1.5">
          {reg.status === "pending" && (
            <MiniBtn disabled={isBusy} onClick={() => run(reg.id, () => updateRegistrationStatus(reg.id, "confirmed"))}>
              確認
            </MiniBtn>
          )}
          {reg.status !== "cancelled" && (
            <MiniBtn disabled={isBusy} onClick={() => run(reg.id, () => updateRegistrationStatus(reg.id, "cancelled"))}>
              取消
            </MiniBtn>
          )}
          <MiniBtn
            danger
            disabled={isBusy}
            onClick={() => {
              if (confirm(`刪除「${reg.name}」的報名紀錄？`)) {
                run(reg.id, () => deleteRegistration(reg.id));
              }
            }}
          >
            刪除
          </MiniBtn>
        </div>
      </div>
    </div>
  );
}

function MiniBtn({
  children,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        background: "transparent",
        border: "none",
        color: danger ? "rgba(214,92,106,0.7)" : "rgba(237,236,234,0.5)",
        padding: "0.15rem 0.35rem",
        fontFamily: "var(--font-space-mono)",
        fontSize: "0.6rem",
        letterSpacing: "0.06em",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {children}
    </button>
  );
}
