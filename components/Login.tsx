import React, { useEffect, useMemo, useState } from "react";
import { Ship, Lock, Mail, AlertCircle, Eye, EyeOff, Phone, KeyRound } from "lucide-react";
import {
  RecaptchaVerifier,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  onAuthStateChanged,
  type ConfirmationResult
} from "firebase/auth";
import { auth } from "../services/firebaseConfig";

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<"password" | "otp">("password");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  const otpStep = useMemo(() => (confirmation ? "verify" : "send"), [confirmation]);

  // Wait for Firebase Auth to be ready
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        onLogin(); // already logged in
      }
      setAuthReady(true);
    });

    return () => unsub();
  }, [onLogin]);

  // Cleanup recaptcha verifier on unmount
  useEffect(() => {
    return () => {
      const verifier = (auth as any)?._recaptchaVerifier as RecaptchaVerifier | undefined;
      if (verifier) {
        try {
          verifier.clear();
        } catch {
          // ignore
        }
        (auth as any)._recaptchaVerifier = undefined;
      }
    };
  }, []);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await signInWithEmailAndPassword(auth, email.trim(), password);
      if (res.user) {
        onLogin();
      } else {
        setError("Login failed");
      }
    } catch (err: any) {
      if (err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        setError("Invalid email or password");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many attempts. Please try again later.");
      } else {
        setError("Firebase error: " + err.code);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const ensureRecaptcha = () => {
    const existing = (auth as any)._recaptchaVerifier as RecaptchaVerifier | undefined;
    if (existing) return existing;

    const el = document.getElementById("recaptcha-container");
    if (!el) return null;

    const verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible"
    });
    (auth as any)._recaptchaVerifier = verifier;
    return verifier;
  };

  const normalizeE164 = (raw: string) => {
    const v = raw.trim();
    if (!v) return "";
    // If user already entered +<countrycode>..., keep it
    if (v.startsWith("+")) return v;
    // Default to India (+91) if not provided
    const digits = v.replace(/[^0-9]/g, "");
    return digits ? `+91${digits}` : "";
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const verifier = ensureRecaptcha();
      if (!verifier) {
        setError("reCAPTCHA not ready. Please refresh and try again.");
        return;
      }

      const phoneE164 = normalizeE164(phone);
      if (!phoneE164 || phoneE164.length < 8) {
        setError("Please enter a valid phone number.");
        return;
      }

      const result = await signInWithPhoneNumber(auth, phoneE164, verifier);
      setConfirmation(result);
    } catch (err: any) {
      if (err.code === "auth/invalid-phone-number") {
        setError("Invalid phone number.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many OTP attempts. Please try again later.");
      } else {
        setError("Firebase error: " + err.code);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      if (!confirmation) {
        setError("Please request OTP first.");
        return;
      }
      const code = otp.trim();
      if (code.length < 4) {
        setError("Please enter the OTP.");
        return;
      }

      const res = await confirmation.confirm(code);
      if (res.user) {
        onLogin();
      } else {
        setError("OTP verification failed");
      }
    } catch (err: any) {
      if (err.code === "auth/invalid-verification-code") {
        setError("Invalid OTP.");
      } else if (err.code === "auth/code-expired") {
        setError("OTP expired. Please request a new one.");
      } else {
        setError("Firebase error: " + err.code);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetOtp = () => {
    setConfirmation(null);
    setOtp("");
    setError("");
  };

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-600">
        Initializing secure login…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">

        <div className="bg-gradient-to-r from-blue-900 to-blue-800 p-8 text-center">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-white rounded-xl shadow-lg flex items-center justify-center mb-4">
              <Ship className="text-blue-700" size={32} />
            </div>
            <h1 className="text-3xl font-black text-white">MARINE EDGE</h1>
            <p className="text-blue-200 text-sm mt-1">An ocean of opportunities</p>
          </div>
        </div>

        <div className="p-8">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold text-slate-800">HR Portal Login</h2>
            <p className="text-slate-500 text-sm mt-1">
              Sign in using your company account
            </p>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setMode("password");
                setError("");
                resetOtp();
              }}
              className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
                mode === "password" ? "bg-white text-slate-900 shadow" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Email + Password
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("otp");
                setError("");
              }}
              className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
                mode === "otp" ? "bg-white text-slate-900 shadow" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Phone OTP
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-sm text-red-600 mb-5">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {mode === "password" && (
            <form onSubmit={handlePasswordLogin} className="space-y-5">

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-700 text-white py-2.5 rounded-lg font-bold"
            >
              {isLoading ? "Signing in…" : "Sign In"}
            </button>

            </form>
          )}

          {mode === "otp" && (
            <div className="space-y-4">
              {/* Required by Firebase for phone auth */}
              <div id="recaptcha-container" />

              {otpStep === "send" ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="tel"
                        required
                        placeholder="+91XXXXXXXXXX"
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Tip: If you don’t include a country code, we’ll assume +91.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-700 text-white py-2.5 rounded-lg font-bold"
                  >
                    {isLoading ? "Sending OTP…" : "Send OTP"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="text-sm text-slate-600">
                    OTP sent to <span className="font-bold">{normalizeE164(phone)}</span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Enter OTP
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        required
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg"
                        value={otp}
                        onChange={e => setOtp(e.target.value)}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-700 text-white py-2.5 rounded-lg font-bold"
                  >
                    {isLoading ? "Verifying…" : "Verify & Sign In"}
                  </button>

                  <button
                    type="button"
                    onClick={resetOtp}
                    className="w-full py-2.5 rounded-lg font-bold border border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    Resend OTP
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t text-center">
          <p className="text-xs text-slate-500">
            © 2025 Marine Edge Technologies Pvt Ltd
          </p>
        </div>

      </div>
    </div>
  );
};

export default Login;
