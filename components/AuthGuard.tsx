"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (pathname.startsWith("/admin") && user?.role !== "superadmin") {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, pathname, router, user?.role]);

  if (isLoading) {
    return (
      <div className="aurora-bg min-vh-100 d-flex align-items-center justify-content-center p-4">
        <div className="app-card px-4 py-3 text-center">
          <p className="small fw-semibold text-secondary mb-0">Checking your session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (pathname.startsWith("/admin") && user?.role !== "superadmin") {
    return null;
  }

  return <>{children}</>;
}
