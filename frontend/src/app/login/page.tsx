"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FlaskConical, Lock, User, Loader2, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [user, setUser] = useState("assessment.it");
  const [password, setPassword] = useState("Password123?");
  const [appCode, setAppCode] = useState("ASSESSMENT");
  const [moduleCode, setModuleCode] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appCode, moduleCode, user, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Username atau password salah");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Gagal terhubung ke server autentikasi");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
        <div className="bg-emerald-700 px-8 py-6 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 rounded-xl">
              <FlaskConical className="w-7 h-7 text-emerald-100" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wide">TRACKLAB</h1>
              <p className="text-xs text-emerald-100">
                Pharma MetricLabs • Kalbe Biopharma
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleLogin} className="p-8 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Sign in to your account
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Gunakan kredensial assessment untuk masuk ke sistem
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                  placeholder="assessment.it"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  App Code
                </label>
                <input
                  type="text"
                  value={appCode}
                  onChange={(e) => setAppCode(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Module Code
                </label>
                <input
                  type="text"
                  value={moduleCode}
                  onChange={(e) => setModuleCode(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-medium text-sm rounded-lg transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Authenticating...
              </>
            ) : (
              "Sign In"
            )}
          </button>

          <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Protected via HttpOnly Cookie & .NET Audit Logging
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}