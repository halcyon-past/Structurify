"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/");
      } else if (userData && userData.role !== "admin" && userData.role !== "owner") {
        router.push("/");
      }
    }
  }, [user, userData, loading, router]);

  if (loading || !user || !userData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  if (userData.role !== "admin" && userData.role !== "owner") {
    return null;
  }

  return <>{children}</>;
}
