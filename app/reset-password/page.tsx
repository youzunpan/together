import ResetForm from "./ResetForm";

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <p style={{ fontFamily: "var(--font-noto-serif)", fontSize: "2.25rem", color: "#edecea", lineHeight: 1 }}>設定新密碼</p>
          <p style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", letterSpacing: "0.2em", color: "rgba(237,236,234,0.25)", marginTop: "0.5rem" }}>
            RESET PASSWORD
          </p>
        </div>
        <ResetForm />
      </div>
    </div>
  );
}
