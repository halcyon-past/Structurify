"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";
import Link from "next/link";
import { LogOut, Shield } from "lucide-react";

export function Header() {
  const { user, userData, loading, signInWithGoogle, logOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="w-full flex items-center justify-between p-4 relative">
      <div className="flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2 group">
          <Image src="/logo.svg" alt="Logo" width={28} height={28} className="group-hover:opacity-80 transition-opacity" />
          <span className="font-bold text-lg text-white tracking-tight group-hover:text-gray-300 transition-colors hidden sm:block">
            Structurify
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {/* Docs button available to EVERYONE */}
        <Link 
          href="/docs"
          className="text-sm font-medium text-gray-400 hover:text-white transition-colors px-3 py-2 rounded-md hover:bg-white/5"
        >
          Docs
        </Link>

        {!loading && (
          user ? (
            <div className="flex items-center gap-2 sm:gap-4">
              <Link 
                href="/history"
                className="text-sm font-medium text-gray-400 hover:text-white transition-colors px-3 py-2 rounded-md hover:bg-white/5 hidden sm:block"
              >
                History
              </Link>
              
              {/* Profile Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg pl-2 pr-3 py-1.5 transition-all focus:outline-none"
                >
                  {user.photoURL ? (
                    <Image 
                      src={user.photoURL} 
                      alt={user.displayName || "User"} 
                      width={24} 
                      height={24} 
                      className="rounded-md"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center text-xs font-bold text-white">
                      {user.email?.[0].toUpperCase() || "U"}
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-200 hidden md:block max-w-[150px] truncate">
                    {user.displayName || user.email}
                  </span>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-[#111] border border-white/10 rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 border-b border-white/10 md:hidden">
                      <p className="text-sm font-medium text-white truncate">{user.displayName}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>

                    {(userData?.role?.toLowerCase() === "admin" || userData?.role?.toLowerCase() === "owner") && (
                      <Link 
                        href="/admin"
                        onClick={() => setDropdownOpen(false)}
                        className="w-full text-left px-4 py-3 text-sm font-medium text-emerald-400 hover:bg-white/5 hover:text-emerald-300 transition-colors flex items-center gap-2 border-b border-white/10"
                      >
                        <Shield size={16} />
                        Admin Dashboard
                      </Link>
                    )}
                    
                    <button 
                      onClick={() => {
                        setDropdownOpen(false);
                        logOut();
                      }}
                      className="w-full text-left px-4 py-3 text-sm font-medium text-red-400 hover:bg-white/5 hover:text-red-300 transition-colors flex items-center gap-2"
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <button 
              onClick={signInWithGoogle}
              className="flex items-center gap-2 text-sm font-medium text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg border border-white/10 transition-colors"
            >
              Sign In
            </button>
          )
        )}
      </div>
    </header>
  );
}
