"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { hasAdminRole } from "@/lib/auth/client";
import { LayoutDashboard, Package, LogOut } from "lucide-react";

function displayNameFromEmail(email: string) {
  const name = email.split("@")[0] ?? email;
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export default function UserSubNav({ user }: { user: User }) {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      const admin = await hasAdminRole();
      setIsAdmin(admin);
    })();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  };

  const name = displayNameFromEmail(user.email ?? "User");

  // Base item: stays compact, never wraps, prevents layout breakage.
  const navItemClass = `
    group inline-flex items-center justify-center gap-1.5
    px-2.5 py-1
    rounded-full
    text-[11px] font-medium tracking-wide
    whitespace-nowrap
    transition-all duration-200
    text-zinc-600 dark:text-zinc-400
    hover:text-zinc-900 dark:hover:text-white
    hover:bg-zinc-100 dark:hover:bg-white/10
    focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50
  `;

  return (
    <div
      className="
        sticky top-[var(--subnav-offset,0px)]
        z-40 w-full
        backdrop-blur-xl rounded-b-lg
        bg-white/70 dark:bg-black/70
        border-b border-black/5 dark:border-white/5
      "
      role="navigation"
      aria-label="User quick navigation"
    >
      <div className="container mx-auto h-7 px-2 sm:px-4 flex items-center justify-between gap-2">
        {/* Left: User Status */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative flex items-center justify-center shrink-0">
            <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-20"></span>
            <span className="relative inline-block size-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
          </div>

          {/* Hide "Hi," on ultra-small, keep the name */}
          <span className="truncate text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400">
            <span className="hidden xs:inline">Hi, </span>
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              {name}
            </span>
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {isAdmin && (
            <Link
              href="/admin"
              className={navItemClass}
              title="Admin Dashboard"
              aria-label="Admin Dashboard"
            >
              <LayoutDashboard className="size-3.5 opacity-70 group-hover:opacity-100 transition-opacity" />
              {/* Collapse label on small screens */}
              <span className="hidden sm:inline">Admin</span>
            </Link>
          )}

          <Link
            href="/orders"
            className={navItemClass}
            title="View your orders"
            aria-label="View your orders"
          >
            <Package className="size-3.5 opacity-70 group-hover:opacity-100 transition-opacity" />
            <span className="hidden sm:inline">Orders</span>
          </Link>

          {/* Divider disappears on small to save space */}
          <div className="mx-1 h-3 w-[1px] bg-zinc-200 dark:bg-white/10 hidden sm:block" />

          <button
            onClick={handleSignOut}
            className={`${navItemClass} hover:text-red-600 dark:hover:text-red-400 dark:hover:bg-red-500/10`}
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="size-3.5 opacity-70 group-hover:opacity-100 transition-opacity" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-50 dark:opacity-70" />
    </div>
  );
}

