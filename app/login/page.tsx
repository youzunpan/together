import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <p style={{ fontFamily: "var(--font-noto-serif)", fontSize: "3rem", color: "#edecea", lineHeight: 1 }}>同在</p>
          <p style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", letterSpacing: "0.2em", color: "rgba(237,236,234,0.25)", marginTop: "0.5rem" }}>
            TOGETHER · EST. 2025
          </p>
        </div>
        <LoginForm />
        <p className="text-center mt-6" style={{ fontSize: "0.75rem", color: "rgba(237,236,234,0.3)", letterSpacing: "0.05em" }}>
          還沒加入？<a href="/apply" style={{ color: "#BEC23F", textDecoration: "underline", textUnderlineOffset: "3px" }}>申請加入</a>
        </p>
      </div>
    </div>
  );
}
