export default function Loading() {
  return (
    <div className="max-w-md mx-auto px-4">
      <header className="pt-4 pb-3">
        <p
          className="text-center mb-3"
          style={{
            fontFamily: "var(--font-space-mono)",
            fontSize: "0.65rem",
            letterSpacing: "0.2em",
            color: "rgba(237,236,234,0.25)",
          }}
        >
          同在 · TOGETHER
        </p>
        <div
          style={{
            background: "#2c2c2a",
            border: "1px solid rgba(255,255,255,0.06)",
            padding: "0.875rem 1rem",
            height: "3.5rem",
            opacity: 0.6,
          }}
        />
      </header>
      <div className="mt-6 flex flex-col items-center gap-2">
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#BEC23F",
            animation: "feedLoadingPulse 1.6s ease-in-out infinite",
          }}
        />
      </div>
      <style>{`
        @keyframes feedLoadingPulse {
          0%, 100% { opacity: 0.25; transform: scale(1); }
          50%      { opacity: 1;    transform: scale(1.6); }
        }
      `}</style>
    </div>
  );
}
