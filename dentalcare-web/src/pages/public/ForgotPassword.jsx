import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthService from "../../services/authService";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const RESEND_COOLDOWN_SECONDS = 60;

  const [step, setStep] = useState("email"); // email, otp, reset
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Resend OTP cooldown timer
  useEffect(() => {
    if (step !== "otp" || resendCooldown <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step, resendCooldown]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email) {
      setError("Email is required.");
      return;
    }

    try {
      setLoading(true);
      const result = await AuthService.forgotPasswordSendOtp(email);

      if (!result?.success) {
        setError(result?.message || "Failed to send OTP");
        return;
      }

      setSuccess("OTP sent to your email. Please check your inbox.");
      setStep("otp");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!otp) {
      setError("OTP is required.");
      return;
    }

    try {
      setLoading(true);
      const result = await AuthService.forgotPasswordVerifyOtp(email, otp);

      if (!result?.success) {
        setError(result?.message || "Failed to verify OTP");
        return;
      }

      setResetToken(result?.data?.resetToken);
      setSuccess("OTP verified successfully.");
      setStep("reset");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!password || !confirmPassword) {
      setError("Both password fields are required.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const result = await AuthService.forgotPasswordReset(resetToken, password, confirmPassword);

      if (!result?.success) {
        setError(result?.message || "Failed to reset password");
        return;
      }

      setSuccess("Password reset successfully! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async (e) => {
    e.preventDefault();
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    await handleSendOtp(e);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-rose-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-2">
              Reset Password
            </h1>
            <p className="text-gray-600 text-sm">
              {step === "email"
                ? "Enter your email to receive a reset code"
                : step === "otp"
                ? "Enter the code sent to your email"
                : "Create your new password"}
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Success Alert */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          )}

          {/* Step 1: Email */}
          {step === "email" && (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 rounded-lg border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-pink-500 to-rose-400 px-4 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white shadow-md transition hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Sending..." : "Send Reset Code"}
              </button>
            </form>
          )}

          {/* Step 2: OTP */}
          {step === "otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div>
                <label htmlFor="otp" className="block text-sm font-semibold text-gray-700 mb-2">
                  Verification Code
                </label>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.toUpperCase())}
                  placeholder="000000"
                  maxLength="6"
                  className="w-full px-4 py-3 rounded-lg border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-center text-2xl tracking-widest"
                  disabled={loading}
                />
              </div>

              <div className="text-center text-sm text-gray-600">
                <p>
                  Code sent to <span className="font-semibold text-gray-900">{email}</span>
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-pink-500 to-rose-400 px-4 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white shadow-md transition hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Verifying..." : "Verify Code"}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || loading}
                  className="text-sm font-semibold text-pink-600 hover:text-pink-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Reset Password */}
          {step === "reset" && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-4 py-3 rounded-lg border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-4 py-3 rounded-lg border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-pink-500 to-rose-400 px-4 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white shadow-md transition hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}

          {/* Back to Login Link */}
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-sm font-semibold text-pink-600 hover:text-pink-700"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
