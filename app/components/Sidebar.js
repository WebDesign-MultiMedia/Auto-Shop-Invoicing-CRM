"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "../actions/auth";

const NAV_ITEMS = [
  {
    href: "/",
    label: "New Receipt",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path
          d="M6 3h12a1 1 0 011 1v16l-3-2-3 2-3-2-3 2-3-2V4a1 1 0 011-1z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="M9 8h6M9 12h6M9 16h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/history",
    label: "History",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path d="M4 20V10M11 20V4M18 20v-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-center gap-6 border-t border-slate-800 bg-slate-950 px-4 py-3 lg:static lg:inset-auto lg:w-16 lg:flex-col lg:items-center lg:justify-start lg:gap-3 lg:border-t-0 lg:border-r lg:py-6">
      <div className="hidden h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-lg lg:mb-4 lg:flex">
        🔧
      </div>

      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            className={`flex h-10 w-10 items-center justify-center rounded-lg transition ${
              isActive
                ? "bg-blue-600 text-white"
                : "text-slate-500 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            {item.icon}
          </Link>
        );
      })}

      <form action={logoutAction} className="lg:mt-auto">
        <button
          type="submit"
          title="Log out"
          aria-label="Log out"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-800 hover:text-slate-200"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
            <path d="M14 4h4a1 1 0 011 1v14a1 1 0 01-1 1h-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M10 8l-4 4 4 4M6 12h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </form>
    </aside>
  );
}
