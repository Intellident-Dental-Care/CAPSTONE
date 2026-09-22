import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthService from "../../services/authService";

import logo from "../../assets/logo.png";
import clinicImage from "../../assets/picture4.png";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const RESEND_COOLDOWN_SECONDS = 60;

  // =========================================================
  // STATES
  // =========================================================

  const [step, setStep] = useState("email"); // email | otp | reset

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [resetToken, setResetToken] = useState("");

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [resendCooldown, setResendCooldown] = useState(0);

  const [resetIdentity, setResetIdentity] = useState(null);

  // =========================================================
  // OTP COUNTDOWN
  // =========================================================

  useEffect(() => {
    if (step !== "otp" || resendCooldown <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setResendCooldown((prev) =>
        prev <= 1 ? 0 : prev - 1
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [step, resendCooldown]);

  // =========================================================
  // SEND OTP
  // =========================================================

  const handleSendOtp = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);

      const result =
        await AuthService.forgotPasswordSendOtp(cleanEmail);

      if (!result?.success) {
        setError(
          result?.message ||
            "Failed to send verification code."
        );

        return;
      }

      setEmail(cleanEmail);

      setResetIdentity(
        result?.data || null
      );

      setSuccess(
        "Verification code sent successfully."
      );

      setStep("otp");

      // Start cooldown only AFTER successful sending.
      setResendCooldown(
        RESEND_COOLDOWN_SECONDS
      );
    } catch (err) {
      console.error(
        "Forgot password send OTP error:",
        err
      );

      setError(
        "Something went wrong while sending the verification code."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // VERIFY OTP
  // =========================================================

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!otp || otp.length !== 6) {
      setError(
        "Please enter the complete 6-digit verification code."
      );

      return;
    }

    try {
      setLoading(true);

      const result =
        await AuthService.forgotPasswordVerifyOtp(
          email,
          otp,
          resetIdentity
        );

      if (!result?.success) {
        setError(
          result?.message ||
            "Failed to verify the code."
        );

        return;
      }

      if (!result?.data?.resetToken) {
        setError(
          "Unable to continue with password reset. Please request a new verification code."
        );

        return;
      }

      setResetToken(
        result.data.resetToken
      );

      setSuccess("");

      setStep("reset");
    } catch (err) {
      console.error(
        "Forgot password verify OTP error:",
        err
      );

      setError(
        "Something went wrong while verifying the code."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // RESEND OTP
  // =========================================================

  const handleResendOtp = async () => {
    if (
      resendCooldown > 0 ||
      resending
    ) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      setResending(true);

      const result =
        await AuthService.forgotPasswordSendOtp(
          email
        );

      if (!result?.success) {
        setError(
          result?.message ||
            "Failed to resend verification code."
        );

        return;
      }

      // Update identity if backend returns a new one.
      if (result?.data) {
        setResetIdentity(
          result.data
        );
      }

      setSuccess(
        "A new verification code has been sent to your email."
      );

      // IMPORTANT:
      // Start cooldown only if resend succeeded.
      setResendCooldown(
        RESEND_COOLDOWN_SECONDS
      );
    } catch (err) {
      console.error(
        "Forgot password resend OTP error:",
        err
      );

      setError(
        "Something went wrong while resending the verification code."
      );
    } finally {
      setResending(false);
    }
  };

  // =========================================================
  // RESET PASSWORD
  // =========================================================

  const handleResetPassword = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!password || !confirmPassword) {
      setError(
        "Please complete both password fields."
      );

      return;
    }

    if (password.length < 8) {
      setError(
        "Password must be at least 8 characters long."
      );

      return;
    }

    if (password !== confirmPassword) {
      setError(
        "Passwords do not match."
      );

      return;
    }

    if (!resetToken) {
      setError(
        "Your password reset session is invalid. Please request another verification code."
      );

      return;
    }

    try {
      setLoading(true);

      const result =
        await AuthService.forgotPasswordReset(
          resetToken,
          password,
          confirmPassword
        );

      if (!result?.success) {
        setError(
          result?.message ||
            "Failed to reset password."
        );

        return;
      }

      setSuccess(
        "Password changed successfully! Redirecting you to login..."
      );

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      console.error(
        "Forgot password reset error:",
        err
      );

      setError(
        "Something went wrong while resetting your password."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // GO BACK ONE STEP
  // =========================================================

  const handleBack = () => {
    setError("");
    setSuccess("");

    if (step === "otp") {
      setOtp("");
      setResendCooldown(0);
      setStep("email");
      return;
    }

    if (step === "reset") {
      setPassword("");
      setConfirmPassword("");
      setResetToken("");
      setOtp("");
      setResendCooldown(0);
      setStep("email");
      return;
    }

    navigate("/login");
  };

  // =========================================================
  // STEP INFORMATION
  // =========================================================

  const getStepNumber = () => {
    if (step === "email") return 1;
    if (step === "otp") return 2;

    return 3;
  };

  const currentStep = getStepNumber();

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="h-screen w-full overflow-hidden bg-[radial-gradient(circle_at_top_left,_#ffe3ee,_#fff7fa_34%,_#ffffff_72%)] p-3 sm:p-4 lg:p-6">

      <div className="grid h-full overflow-hidden rounded-[34px] border border-pink-200/70 bg-white shadow lg:grid-cols-[1.03fr_0.97fr]">

        {/* ===================================================
            LEFT SIDE
        =================================================== */}

        <div className="relative hidden h-full overflow-hidden lg:flex">

          <style>
            {`
              @keyframes slowZoom {
                0%, 100% {
                  transform: scale(1);
                }

                50% {
                  transform: scale(1.04);
                }
              }
            `}
          </style>

          <img
            src={clinicImage}
            alt="GC Dental Care Clinic"
            className="absolute inset-0 h-full w-full object-cover"
            style={{
              animation:
                "slowZoom 5s infinite",
              objectPosition: "10%",
            }}
          />

          <div className="absolute inset-0 bg-gradient-to-br from-pink-200/72 via-pink-100/42 to-white/10" />

          <div className="absolute inset-0 bg-slate-900/12" />

          <div className="relative z-20 flex h-full w-full flex-col justify-between p-10">

            {/* Logo */}
            <div className="flex items-center gap-3">

              <img
                src={logo}
                alt="GC Dental Care Logo"
                className="h-12 w-12 rounded-2xl bg-white/80 p-1"
              />

              <div>

                <h1 className="font-bold text-white">
                  GC Dental Care
                </h1>

                <p className="text-xs text-white/80">
                  Powered by IntelliDent
                </p>

              </div>

            </div>

            {/* Bottom Information */}
            <div>

              <div className="mb-5 inline-flex rounded-full border border-white/35 bg-white/18 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md">
                Secure Account Recovery
              </div>

              <h2 className="max-w-md text-3xl font-bold leading-tight text-white">
                Regain access to your account securely.
              </h2>

              <p className="mt-3 max-w-md text-sm leading-6 text-white/85">
                Verify your email and create a new
                password to continue using IntelliDent.
              </p>

            </div>

          </div>

        </div>

        {/* ===================================================
            RIGHT SIDE
        =================================================== */}

        <div className="flex h-full items-center justify-center overflow-y-auto bg-[#fffafb] px-6 py-8 sm:px-10 lg:px-14">

          <div className="w-full max-w-md">

            {/* =================================================
                BRAND
            ================================================= */}

            <div className="mb-7 flex items-center gap-3">

              <img
                src={logo}
                alt="GC Dental Care Logo"
                className="h-10 w-10"
              />

              <div>

                <h2 className="font-bold text-slate-900">
                  GC Dental Care
                </h2>

                <p className="text-xs text-slate-400">
                  Powered by IntelliDent
                </p>

              </div>

            </div>

            {/* =================================================
                BACK BUTTON
            ================================================= */}

            <button
              type="button"
              onClick={handleBack}
              className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-pink-600"
            >
              <span className="text-lg">
                ←
              </span>

              {step === "email"
                ? "Back to Login"
                : "Back"}
            </button>

            {/* =================================================
                STEP INDICATOR
            ================================================= */}

            <div className="mb-7">

              <div className="flex items-center">

                {/* Step 1 */}
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${
                    currentStep >= 1
                      ? "bg-pink-500 text-white"
                      : "bg-pink-100 text-pink-500"
                  }`}
                >
                  1
                </div>

                <div
                  className={`h-[2px] flex-1 ${
                    currentStep >= 2
                      ? "bg-pink-400"
                      : "bg-pink-100"
                  }`}
                />

                {/* Step 2 */}
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${
                    currentStep >= 2
                      ? "bg-pink-500 text-white"
                      : "bg-pink-100 text-pink-500"
                  }`}
                >
                  2
                </div>

                <div
                  className={`h-[2px] flex-1 ${
                    currentStep >= 3
                      ? "bg-pink-400"
                      : "bg-pink-100"
                  }`}
                />

                {/* Step 3 */}
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${
                    currentStep >= 3
                      ? "bg-pink-500 text-white"
                      : "bg-pink-100 text-pink-500"
                  }`}
                >
                  3
                </div>

              </div>

              <div className="mt-2 grid grid-cols-3 text-center text-[10px] font-medium text-slate-400">

                <span>
                  Email
                </span>

                <span>
                  Verify
                </span>

                <span>
                  Password
                </span>

              </div>

            </div>

            {/* =================================================
                HEADER
            ================================================= */}

            <div>

              {step === "email" && (
                <>
                  <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                    Forgot your password?
                  </h1>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    No worries. Enter your email
                    address and we'll send you a
                    verification code.
                  </p>
                </>
              )}

              {step === "otp" && (
                <>
                  <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                    Check your email
                  </h1>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    We sent a 6-digit verification
                    code to
                  </p>

                  <p className="mt-1 break-all text-sm font-semibold text-pink-600">
                    {email}
                  </p>
                </>
              )}

              {step === "reset" && (
                <>
                  <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                    Create new password
                  </h1>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Choose a secure password for
                    your GC Dental Care account.
                  </p>
                </>
              )}

            </div>

            {/* =================================================
                ERROR MESSAGE
            ================================================= */}

            {error && (
              <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">

                <p className="text-sm text-rose-600">
                  {error}
                </p>

              </div>
            )}

            {/* =================================================
                SUCCESS MESSAGE
            ================================================= */}

            {success && (
              <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">

                <p className="text-sm text-emerald-700">
                  {success}
                </p>

              </div>
            )}

            {/* =================================================
                STEP 1 — EMAIL
            ================================================= */}

            {step === "email" && (

              <form
                onSubmit={handleSendOtp}
                className="mt-7 space-y-6"
              >

                <div>

                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Email Address
                  </label>

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) =>
                      setEmail(
                        e.target.value
                      )
                    }
                    placeholder="Enter your email"
                    autoComplete="email"
                    disabled={loading}
                    className="w-full rounded-2xl border border-pink-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                  />

                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-gradient-to-r from-pink-500 to-rose-400 py-3.5 font-bold uppercase tracking-[0.16em] text-white shadow-sm transition hover:shadow-md active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? "Sending..."
                    : "Send Verification Code"}
                </button>

              </form>

            )}

            {/* =================================================
                STEP 2 — OTP
            ================================================= */}

            {step === "otp" && (

              <form
                onSubmit={handleVerifyOtp}
                className="mt-7 space-y-6"
              >

                <div>

                  <label
                    htmlFor="otp"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Verification Code
                  </label>

                  <input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={otp}
                    onChange={(e) =>
                      setOtp(
                        e.target.value
                          .replace(
                            /\D/g,
                            ""
                          )
                          .slice(0, 6)
                      )
                    }
                    placeholder="000000"
                    maxLength={6}
                    disabled={loading}
                    className="w-full rounded-2xl border border-pink-200 bg-white px-4 py-4 text-center text-2xl font-bold tracking-[0.5em] text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                  />

                  <p className="mt-2 text-center text-xs text-slate-400">
                    Enter the 6-digit code sent
                    to your email.
                  </p>

                </div>

                <button
                  type="submit"
                  disabled={
                    loading ||
                    otp.length !== 6
                  }
                  className="w-full rounded-2xl bg-gradient-to-r from-pink-500 to-rose-400 py-3.5 font-bold uppercase tracking-[0.16em] text-white shadow-sm transition hover:shadow-md active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? "Verifying..."
                    : "Verify Code"}
                </button>

                {/* Resend */}
                <div className="text-center">

                  <p className="mb-1 text-xs text-slate-400">
                    Didn't receive the code?
                  </p>

                  <button
                    type="button"
                    onClick={
                      handleResendOtp
                    }
                    disabled={
                      resendCooldown > 0 ||
                      resending ||
                      loading
                    }
                    className="text-sm font-semibold text-pink-600 transition hover:text-pink-700 disabled:cursor-not-allowed disabled:text-slate-400"
                  >
                    {resending
                      ? "Sending..."
                      : resendCooldown > 0
                      ? `Resend code in ${resendCooldown}s`
                      : "Resend Code"}
                  </button>

                </div>

              </form>

            )}

            {/* =================================================
                STEP 3 — NEW PASSWORD
            ================================================= */}

            {step === "reset" && (

              <form
                onSubmit={
                  handleResetPassword
                }
                className="mt-7 space-y-5"
              >

                {/* New Password */}
                <div>

                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    New Password
                  </label>

                  <div className="relative">

                    <input
                      id="password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={password}
                      onChange={(e) =>
                        setPassword(
                          e.target.value
                        )
                      }
                      placeholder="Enter new password"
                      autoComplete="new-password"
                      disabled={loading}
                      className="w-full rounded-2xl border border-pink-100 bg-white px-4 py-3 pr-16 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (prev) =>
                            !prev
                        )
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-pink-500 transition hover:text-pink-600"
                    >
                      {showPassword
                        ? "Hide"
                        : "Show"}
                    </button>

                  </div>

                  <p className="mt-2 text-xs text-slate-400">
                    Use at least 8 characters.
                  </p>

                </div>

                {/* Confirm Password */}
                <div>

                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Confirm New Password
                  </label>

                  <div className="relative">

                    <input
                      id="confirmPassword"
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      value={
                        confirmPassword
                      }
                      onChange={(e) =>
                        setConfirmPassword(
                          e.target.value
                        )
                      }
                      placeholder="Re-enter new password"
                      autoComplete="new-password"
                      disabled={loading}
                      className="w-full rounded-2xl border border-pink-100 bg-white px-4 py-3 pr-16 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(
                          (prev) =>
                            !prev
                        )
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-pink-500 transition hover:text-pink-600"
                    >
                      {showConfirmPassword
                        ? "Hide"
                        : "Show"}
                    </button>

                  </div>

                  {/* Live match indicator */}
                  {confirmPassword && (
                    <p
                      className={`mt-2 text-xs font-medium ${
                        password ===
                        confirmPassword
                          ? "text-emerald-600"
                          : "text-rose-500"
                      }`}
                    >
                      {password ===
                      confirmPassword
                        ? "Passwords match."
                        : "Passwords do not match."}
                    </p>
                  )}

                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-gradient-to-r from-pink-500 to-rose-400 py-3.5 font-bold uppercase tracking-[0.16em] text-white shadow-sm transition hover:shadow-md active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? "Updating..."
                    : "Reset Password"}
                </button>

              </form>

            )}

            {/* =================================================
                SECURITY NOTE
            ================================================= */}

            <div className="mt-7 border-t border-pink-100 pt-5 text-center">

              <p className="text-xs leading-5 text-slate-400">
                For your security, never share
                your verification code or password
                with anyone.
              </p>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}