import React, { useState } from "react";
import { loginService } from "../services/authAPI";
import { useNavigate, Link } from "react-router-dom";
import { showSuccessAlert, showErrorAlert } from "../utils/alertUtils";
import { Player } from "@lottiefiles/react-lottie-player";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await loginService({ email, password });
      if (onLogin) onLogin(res);
      await showSuccessAlert("Login berhasil");
      navigate("/dashboard"); // redirect ke dashboard
    } catch (err) {
      setError(err.message || "Login gagal");
      await showErrorAlert(
        "Login gagal",
        err.message || "Login gagal"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white">
      {/* Subtle decorative lines/background accents */}
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div className="absolute -left-10 top-16 h-80 w-2 bg-white/10 rounded-full" />
        <div className="absolute left-4 top-36 h-64 w-2 bg-white/10 rounded-full" />
        <div className="absolute right-10 -top-10 h-60 w-60 rounded-full bg-gradient-to-tr from-sky-400/20 via-blue-400/10 to-transparent blur-2xl" />
      </div>

      <div className="relative z-10 w-full max-w-6xl px-6 md:px-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left: Welcome Panel */}
          <section className="rounded-2xl bg-black/40 p-8 md:p-10 shadow-2xl">
            <div className="flex items-center gap-2 mb-6">
              <span className="h-3 w-3 bg-white/80 rounded" />
              <span className="h-3 w-3 bg-white/80 rounded" />
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">Welcome!</h1>
            <div className="h-[2px] w-12 bg-white/70 my-5" />
            <p className="max-w-xl text-white/80 leading-relaxed">
              Welcome to Manbig, your ultimate platform for managing and organizing your business with ease. Log in to access your personalized dashboard and take control of your operations.
            </p>
          </section>

          {/* Right: Sign-in Card */}
          <section className="relative rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md p-8 md:p-10 shadow-2xl">
            {/* Decorative Lottie accent */}
            <Player
              src="https://assets9.lottiefiles.com/packages/lf20_m1lv6j0v.json"
              autoplay
              loop
              className="pointer-events-none absolute -top-6 -right-6 opacity-40"
              style={{ width: 220, height: 220 }}
            />

            <h2 className="text-2xl md:text-3xl font-bold mb-6">
              <span className="border-b-2 border-white/60 pb-1">Sign in</span>
            </h2>

            {error && (
              <div className="mb-4 rounded-md bg-red-600/30 border border-red-300 px-4 py-2 text-white">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold tracking-wide text-white/90 mb-2">User Name</label>
                <input
                  type="email"
                  className="w-full rounded-full border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/70
                             focus:outline-none focus:ring-2 focus:ring-sky-400"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@email.com"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold tracking-wide text-white/90 mb-2">Password</label>
                <input
                  type="password"
                  className="w-full rounded-full border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/70
                             focus:outline-none focus:ring-2 focus:ring-sky-400"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-full px-4 py-3 text-sm font-bold text-white shadow-xl
                           bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 hover:opacity-95 transition"
                disabled={loading}
              >
                {loading ? "Loading..." : "Submit"}
              </button>
            </form>

            {/* Optional register link (kept but hidden in UI spec) */}
            {/* <div className="mt-4 text-center">
              <span className="text-white/80">Belum punya akun? </span>
              <Link to="/register" className="text-sky-400 hover:underline">Daftar</Link>
            </div> */}
          </section>
        </div>
      </div>
    </div>
  );
}
