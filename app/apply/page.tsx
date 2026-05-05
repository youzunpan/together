import ApplyForm from "./ApplyForm";

export default function ApplyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <p style={{ fontFamily: "var(--font-noto-serif)", fontSize: "3rem", color: "#edecea", lineHeight: 1 }}>同在</p>
          <p style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", letterSpacing: "0.2em", color: "rgba(237,236,234,0.25)", marginTop: "0.5rem" }}>
            APPLY TO JOIN
          </p>
        </div>
        <ApplyForm />
        <p className="text-center mt-6" style={{ fontSize: "0.75rem", color: "rgba(237,236,234,0.25)", letterSpacing: "0.05em" }}>
          送出後請靜候審核。
        </p>
        <p className="text-center mt-8" style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", letterSpacing: "0.12em" }}>
          <a href="/terms" style={{ color: "rgba(237,236,234,0.35)", textDecoration: "underline", textUnderlineOffset: "3px" }}>服務條款</a>
          <span style={{ color: "rgba(237,236,234,0.2)", margin: "0 0.5rem" }}>·</span>
          <a href="/privacy" style={{ color: "rgba(237,236,234,0.35)", textDecoration: "underline", textUnderlineOffset: "3px" }}>隱私政策</a>
        </p>
      </div>
    </div>
  );
}
