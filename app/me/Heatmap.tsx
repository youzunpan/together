"use client";

type Day = { date: string; minutes: number };

function intensity(min: number) {
  if (min === 0) return "rgba(255,255,255,0.04)";
  if (min < 15)  return "rgba(190,194,63,0.25)";
  if (min < 30)  return "rgba(190,194,63,0.5)";
  if (min < 60)  return "rgba(190,194,63,0.75)";
  return "#BEC23F";
}

function handleClick(date: string) {
  const el = document.getElementById(`day-${date}`);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.style.transition = "background 0.3s";
    el.style.background = "#2a2c28";
    setTimeout(() => { el.style.background = "#2c2c2a"; }, 1200);
  }
}

function MonthGrid({ year, month, dataByDate }: { year: number; month: number; dataByDate: Map<string, number> }) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = firstDay.getDay(); // 0=Sun
  const daysInMonth = lastDay.getDate();

  const cells: ({ date: string; minutes: number } | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ date, minutes: dataByDate.get(date) ?? 0 });
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabel = firstDay.toLocaleDateString("en-US", { month: "long", year: "numeric" }).toUpperCase();

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <p style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.65rem", letterSpacing: "0.15em", color: "rgba(237,236,234,0.45)", marginBottom: "0.5rem" }}>
        {monthLabel}
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
        {["S","M","T","W","T","F","S"].map((w, i) => (
          <div key={i} style={{ textAlign: "center", fontFamily: "var(--font-space-mono)", fontSize: "0.55rem", color: "rgba(237,236,234,0.25)", letterSpacing: "0.05em", marginBottom: "2px" }}>
            {w}
          </div>
        ))}
        {cells.map((c, i) => c ? (
          <button
            key={i}
            onClick={() => c.minutes > 0 && handleClick(c.date)}
            disabled={c.minutes === 0}
            title={`${c.date} · ${c.minutes} min`}
            style={{
              aspectRatio: "1 / 1",
              background: intensity(c.minutes),
              border: "none",
              padding: 0,
              cursor: c.minutes > 0 ? "pointer" : "default",
              borderRadius: 2,
              fontFamily: "var(--font-space-mono)",
              fontSize: "0.65rem",
              color: c.minutes >= 60 ? "#1a1b18" : c.minutes > 0 ? "#1a1b18" : "rgba(237,236,234,0.3)",
              fontWeight: c.minutes > 0 ? 600 : 400,
            }}
          >
            {Number(c.date.split("-")[2])}
          </button>
        ) : (
          <div key={i} />
        ))}
      </div>
    </div>
  );
}

export default function Heatmap({ days }: { days: Day[] }) {
  const dataByDate = new Map(days.map(d => [d.date, d.minutes]));

  // 取最近 3 個月（以今天所在月為第 3 個月）
  const today = new Date();
  const months: { year: number; month: number }[] = [];
  for (let i = 2; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth() });
  }

  return (
    <div style={{ marginBottom: "2rem" }}>
      <p style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", letterSpacing: "0.15em", color: "rgba(237,236,234,0.2)", marginBottom: "0.75rem" }}>
        ACTIVITY · LAST 3 MONTHS
      </p>
      {months.map(m => (
        <MonthGrid key={`${m.year}-${m.month}`} year={m.year} month={m.month} dataByDate={dataByDate} />
      ))}
    </div>
  );
}
