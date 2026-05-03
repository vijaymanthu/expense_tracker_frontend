"use client";

import AuthGuard from "@/components/AuthGuard";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { user } = useAuth();

  return (
    <AuthGuard>
      <div className="aurora-bg app-shell d-flex flex-md-row">
        <Sidebar role={user?.role ?? "user"} />
        <div className="app-content flex-grow-1 min-vh-100">
          <Navbar />
          <main className="app-main page-enter">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
