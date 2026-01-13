import React, { useEffect, useState } from "react";
import { Ship, Lock, Mail, ArrowRight, AlertCircle, Eye, EyeOff } from "lucide-react";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { auth } from "../services/firebaseConfig";

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [authReady, setAuthReady] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
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
      } else {
        setError("Firebase error: " + err.code);
      }
    } finally {
      setIsLoading(false);
    }
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

          <form onSubmit={handleSubmit} className="space-y-5">

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-sm text-red-600">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

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
