"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AppRole } from "@/lib/auth-storage";
import {
  CardIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DashboardIcon,
  ExpensesIcon,
  ShieldIcon,
} from "@/components/icons";

type SidebarProps = {
  role: AppRole;
};

type Item = {
  href: string;
  label: string;
  icon: ({ className }: { className?: string }) => React.JSX.Element;
};

const commonItems: Item[] = [
  { href: "/dashboard", label: "Dashboard", icon: DashboardIcon },
  { href: "/expenses", label: "Expenses", icon: ExpensesIcon },
  { href: "/emis", label: "EMIs", icon: CardIcon },
];

const adminItems: Item[] = [{ href: "/admin", label: "Admin Panel", icon: ShieldIcon }];

const itemClass = (isActive: boolean) =>
  `sidebar-link nav-link d-flex align-items-center gap-2 rounded ${isActive ? "active" : ""}`;

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={`sidebar-shell text-light p-3 ${isCollapsed ? "is-collapsed" : ""}`}
    >
      <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
        <div className="d-flex align-items-center gap-2 min-w-0">
          <span className="brand-mark">ET</span>
          {!isCollapsed && <h2 className="h6 mb-0 text-white text-truncate">Expense Tracker</h2>}
        </div>
        <button
          type="button"
          onClick={() => setIsCollapsed((prev) => !prev)}
          className="btn btn-outline-light btn-sm d-none d-md-inline-flex"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </button>
      </div>

      <nav className="nav flex-column gap-1">
        {commonItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className={itemClass(pathname === item.href)} title={item.label}>
              <Icon className="fs-6" />
              {!isCollapsed && item.label}
            </Link>
          );
        })}
      </nav>

      {role === "superadmin" && (
        <div className="mt-4">
          {!isCollapsed && <p className="small text-uppercase text-white-50 mb-2">Administration</p>}
          <nav className="nav flex-column gap-1">
            {adminItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className={itemClass(pathname === item.href)} title={item.label}>
                  <Icon className="fs-6" />
                  {!isCollapsed && item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </aside>
  );
}
