"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { LogoutIcon, UserIcon } from "@/components/icons";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="app-navbar sticky-top px-3 px-lg-4 py-3">
      <div className="d-flex align-items-center justify-content-between gap-3">
        <div className="min-w-0">
          <p className="page-kicker mb-0">Expense Tracker</p>
          <p className="small fw-semibold mb-0 text-truncate">Authenticated workspace</p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Link
            href="/profile"
            className="btn btn-ghost btn-sm d-inline-flex align-items-center gap-2"
          >
            <span className="d-inline-flex align-items-center justify-content-center rounded-circle bg-dark text-white" style={{ width: "28px", height: "28px" }}>
              <UserIcon />
            </span>
            <span className="d-none d-sm-inline">{user?.first_name || "Profile"}</span>
          </Link>
          <button
            type="button"
            onClick={logout}
            className="btn btn-primary d-inline-flex align-items-center justify-content-center"
            aria-label="Logout"
            title="Logout"
          >
            <LogoutIcon />
          </button>
        </div>
      </div>
    </header>
  );
}
