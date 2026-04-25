"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/constants";

interface User {
  id: number;
  username: string;
  email: string;
  display_name: string;
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        
        if (!token) {
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        // Fetch user data from backend
        const res = await fetch(`${API_BASE_URL}/api/auth/user/`, {
          method: "GET",
          headers: {
            "Authorization": `Token ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          // Token is invalid, clear it
          localStorage.removeItem("token");
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [pathname]); // Re-run check when route changes (e.g., after login)

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    setUser(null);
    router.push("/");
  };

  if (loading) {
    return (
      <nav className="glass-panel sticky top-0 z-50 px-6 py-4 flex justify-between items-center mb-8">
        <Link href="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-500 to-sky-400">
          Jangplen
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/" className="text-text-muted hover:text-white transition">Home</Link>
        </div>
      </nav>
    );
  }

  return (
    <nav className="glass-panel sticky top-0 z-50 px-6 py-4 flex justify-between items-center mb-8">
      <Link href="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-500 to-sky-400">
        Jangplen
      </Link>
      <div className="flex items-center gap-6">
        <Link href="/" className="text-text-muted hover:text-white transition font-medium">Home</Link>
        {isAuthenticated && user ? (
          <>
            {/* <Link href="/library" className="text-text-muted hover:text-white transition font-medium">Library</Link> */}
            <Link href="/create" className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 rounded-full text-white font-medium transition shadow-[0_0_15px_rgba(139,92,246,0.4)]">
              Create Song
            </Link>
            <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/10 ml-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-sky-500 flex items-center justify-center text-white font-bold text-sm shadow-inner">
                {(user.display_name || user.username).charAt(0).toUpperCase()}
              </div>
              <span className="text-white font-medium text-sm">
                {user.display_name || user.username}
              </span>
            </div>
            <button 
              onClick={handleLogout}
              className="text-text-muted hover:text-red-400 transition font-medium ml-2 cursor-pointer"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/auth/login" className="text-text-muted hover:text-white transition font-medium">Login</Link>
            <Link href="/auth/register" className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 rounded-full text-white font-medium transition shadow-[0_0_15px_rgba(139,92,246,0.4)]">
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
