import ForgotForm from "./ForgotForm";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <p style={{ fontFamily: "var(--font-noto-serif)", fontSize: "2.25rem", color: "#edecea", lineHeight: 1 }}>忘記密碼</p>
          <p style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", letterSpacing: "0.2em", color: "rgba(237,236,234,0.25)", marginTop: "0.5rem" }}>
            FORGOT PASSWORD
          </p>
        </div>
        <ForgotForm />
        <p className="text-center mt-6" style={{ fontSize: "0.75rem", color: "rgba(237,236,234,0.3)", letterSpacing: "0.05em" }}>
          記起來了？<a href="/login" style={{ color: "#BEC23F", textDecoration: "underline", textUnderlineOffset: "3px" }}>回到登入</a>
        </p>
      </div>
    </div>
  );
}
