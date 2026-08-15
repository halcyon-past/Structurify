"use client";

import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";
import Link from "next/link";

export function Header() {
  const { user, userData, loading, signInWithGoogle, logOut } = useAuth();

  return (
    <header className="w-full flex items-center justify-between p-4 z-50">
      <div className="flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2 group">
          <Image src="/logo.svg" alt="Logo" width={28} height={28} className="group-hover:opacity-80 transition-opacity" />
          <span className="font-bold text-lg text-white tracking-tight group-hover:text-gray-300 transition-colors hidden sm:block">
            Structurify
          </span>
        </Link>
      </div>
      <div className="flex items-center gap-4">
        {!loading && (
          user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-full pl-2 pr-4 py-1 backdrop-blur-md">
                {user.photoURL && (
                  <Image 
                    src={user.photoURL} 
                    alt={user.displayName || "User"} 
                    width={28} 
                    height={28} 
                    className="rounded-full border border-white/20"
                  />
                )}
                <span className="text-sm font-medium text-gray-200 hidden md:block">
                  {user.displayName || user.email}
                </span>
              </div>
              {(userData?.role?.toLowerCase() === "admin" || userData?.role?.toLowerCase() === "owner") && (
                <Link 
                  href="/admin"
                  className="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-emerald-500/20 hover:border-emerald-500/40 whitespace-nowrap"
                >
                  Admin Portal
                </Link>
              )}
              <Link 
                href="/history"
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-transparent hover:border-white/10 hidden sm:block whitespace-nowrap"
              >
                History
              </Link>
              <button 
                onClick={logOut}
                className="text-sm font-medium text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-transparent hover:border-white/10 whitespace-nowrap"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button 
              onClick={signInWithGoogle}
              className="flex items-center gap-2 text-sm font-bold text-white bg-white/10 hover:bg-white/20 px-5 py-2.5 rounded-full border border-white/20 hover:border-white/40 transition-all shadow-lg backdrop-blur-md"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign in with Google
            </button>
          )
        )}
      </div>
    </header>
  );
}
