"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("http://localhost:8000/api/auth/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        router.push("/library");
      } else {
        const errorMsg = Object.values(data).flat().join(", ");
        setError(errorMsg || "Login failed.");
      }
    } catch (err) {
      setError("An error occurred connecting to the server.");
    }
  };

  const handleGoogleLogin = () => {
    // Mock Google login
    router.push("/library");
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      // Send the Google ID token to your Django backend
      const res = await fetch("http://localhost:8000/api/auth/google/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token); // Store the DRF token
        router.push("/library");
      } else {
        setError("Google authentication failed.");
      }
    } catch (err) {
      setError("Server error during Google login.");
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center animate-fade-in">
      <div className="glass-panel p-10 rounded-3xl w-full max-w-md relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-brand-500/30 blur-[40px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 bg-sky-500/30 blur-[40px] rounded-full pointer-events-none"></div>

        <h1 className="text-3xl font-bold text-white mb-2 text-center relative z-10">
          Welcome Back
        </h1>
        <p className="text-text-muted text-center mb-6 relative z-10">
          Sign in to access your masterpieces.
        </p>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-400 p-3 rounded-lg mb-6 text-sm relative z-10">
            {error}
          </div>
        )}

        <form
          onSubmit={handleLogin}
          className="flex flex-col gap-4 relative z-10"
        >
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-brand-500 transition"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-brand-500 transition"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 mt-2 bg-brand-600 hover:bg-brand-500 rounded-xl text-white font-bold transition shadow-[0_0_15px_rgba(139,92,246,0.3)]"
          >
            Sign In
          </button>
        </form>

        <div className="mt-6 flex items-center gap-4 relative z-10">
          <div className="h-px bg-white/10 flex-1"></div>
          <span className="text-xs text-text-muted">OR</span>
          <div className="h-px bg-white/10 flex-1"></div>
        </div>

        <div className="mt-6 flex justify-center relative z-10">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError("Google Login Failed")}
            useOneTap
          />
        </div>

        <p className="text-center text-sm text-text-muted mt-8 relative z-10">
          Don't have an account?{" "}
          <Link
            href="/auth/register"
            className="text-brand-400 hover:text-white transition"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
