export default function Loading() {
  return (
    <div className="max-w-md mx-auto px-4 py-6 flex flex-col items-center">
      <p
        style={{
          fontFamily: "var(--font-space-mono)",
          fontSize: "0.6rem",
          letterSpacing: "0.2em",
          color: "rgba(237,236,234,0.2)",
          marginTop: "1rem",
          marginBottom: "4rem",
        }}
      >
        COURSES
      </p>
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "#BEC23F",
          animation: "coursesLoadingPulse 6s ease-in-out infinite",
        }}
      />
      <style>{`
        @keyframes coursesLoadingPulse {
          0%, 100% { opacity: 0.25; transform: scale(1); }
          50%      { opacity: 1;    transform: scale(1.6); }
        }
      `}</style>
    </div>
  );
}
