"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { API_BASE_URL } from "@/lib/constants";

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    display_name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register/`, {
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
        // Simple error handling
        const errorMsg = Object.values(data).flat().join(", ");
        setError(errorMsg || "Registration failed.");
      }
    } catch (err) {
      setError("An error occurred connecting to the server.");
    }
  };

  const handleGoogleLogin = () => {
    // Mock Google login
    router.push("/library");
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center animate-fade-in pb-10">
      <div className="glass-panel p-10 rounded-3xl w-full max-w-md relative overflow-hidden">
        <div className="absolute top-0 left-0 -ml-16 -mt-16 w-32 h-32 bg-sky-500/30 blur-[40px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 -mr-16 -mb-16 w-32 h-32 bg-brand-500/30 blur-[40px] rounded-full pointer-events-none"></div>

        <h1 className="text-3xl font-bold text-white mb-2 text-center relative z-10">Join as Creator</h1>
        <p className="text-text-muted text-center mb-6 relative z-10">Create an account to start generating music.</p>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-400 p-3 rounded-lg mb-6 text-sm relative z-10">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="flex flex-col gap-4 relative z-10">
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Username</label>
            <input 
              type="text" 
              required
              className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-brand-500 transition"
              placeholder="johndoe"
              value={formData.username}
              onChange={e => setFormData({...formData, username: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Full Name</label>
            <input 
              type="text" 
              required
              className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-brand-500 transition"
              placeholder="John Doe"
              value={formData.display_name}
              onChange={e => setFormData({...formData, display_name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Email</label>
            <input 
              type="email" 
              required
              className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-brand-500 transition"
              placeholder="you@example.com"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Password</label>
            <input 
              type="password" 
              required
              className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-brand-500 transition"
              placeholder="••••••••"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
            />
          </div>
          
          <button 
            type="submit"
            className="w-full py-3 mt-2 bg-brand-600 hover:bg-brand-500 rounded-xl text-white font-bold transition shadow-[0_0_15px_rgba(139,92,246,0.3)]"
          >
            Create Account
          </button>
        </form>

        <div className="mt-6 flex items-center gap-4 relative z-10">
          <div className="h-px bg-white/10 flex-1"></div>
          <span className="text-xs text-text-muted">OR</span>
          <div className="h-px bg-white/10 flex-1"></div>
        </div>

        <button 
          onClick={handleGoogleLogin}
          className="w-full py-3 mt-6 bg-white hover:bg-gray-100 rounded-xl text-black font-bold transition flex items-center justify-center gap-3 relative z-10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>

        <p className="text-center text-sm text-text-muted mt-8 relative z-10">
          Already have an account? <Link href="/auth/login" className="text-brand-400 hover:text-white transition">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

