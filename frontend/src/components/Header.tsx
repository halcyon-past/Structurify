"use client";

import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";
import Link from "next/link";

export function Header() {
  const { user, userData, loading, signInWithGoogle, logOut } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 w-full flex items-center justify-between px-6 py-4 z-50 bg-black/40 backdrop-blur-xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
      <div className="flex items-center gap-2">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative flex items-center justify-center p-1 bg-white/5 rounded-xl border border-white/10 group-hover:bg-white/10 transition-colors shadow-lg">
            <Image src="/logo.svg" alt="Logo" width={24} height={24} className="group-hover:scale-105 transition-transform duration-300" />
          </div>
          <span className="font-extrabold text-xl text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400 tracking-tight hidden sm:block">
            Structurify
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Docs button available to EVERYONE */}
        <Link 
          href="/docs"
          className="text-sm font-semibold text-gray-300 hover:text-white transition-all bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/5 hover:border-white/20 whitespace-nowrap shadow-sm hover:shadow-md"
        >
          Docs
        </Link>

        {!loading && (
          user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2 bg-black/60 border border-white/10 rounded-full pl-1.5 pr-4 py-1.5 backdrop-blur-md shadow-inner hidden md:flex">
                {user.photoURL && (
                  <Image 
                    src={user.photoURL} 
                    alt={user.displayName || "User"} 
                    width={24} 
                    height={24} 
                    className="rounded-full border border-white/20"
                  />
                )}
                <span className="text-sm font-medium text-gray-200">
                  {user.displayName || user.email}
                </span>
              </div>
              
              {(userData?.role?.toLowerCase() === "admin" || userData?.role?.toLowerCase() === "owner") && (
                <Link 
                  href="/admin"
                  className="text-sm font-bold text-emerald-400 hover:text-emerald-300 transition-all bg-emerald-500/10 hover:bg-emerald-500/20 px-4 py-2 rounded-full border border-emerald-500/20 hover:border-emerald-500/40 whitespace-nowrap"
                >
                  Admin Portal
                </Link>
              )}
              
              <Link 
                href="/history"
                className="text-sm font-semibold text-gray-300 hover:text-white transition-all bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/5 hover:border-white/20 whitespace-nowrap"
              >
                History
              </Link>
              
              <button 
                onClick={logOut}
                className="text-sm font-semibold text-red-400 hover:text-red-300 transition-all bg-red-500/5 hover:bg-red-500/10 px-4 py-2 rounded-full border border-transparent hover:border-red-500/20 whitespace-nowrap ml-1 sm:ml-2"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button 
              onClick={signInWithGoogle}
              className="flex items-center gap-2 text-sm font-bold text-white bg-gradient-to-b from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 px-5 py-2.5 rounded-full border border-white/20 hover:border-white/40 transition-all shadow-lg hover:shadow-xl backdrop-blur-md ml-1 sm:ml-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign In
            </button>
          )
        )}
      </div>
    </header>
  );
}
