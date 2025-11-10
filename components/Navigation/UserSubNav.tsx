"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { hasAdminRole } from "@/lib/auth/client";

function displayNameFromEmail(email: string) {
  const name = email.split("@")[0] ?? email;
  // Title-case first segment, keep the rest as typed
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

  return (
    <div
      className="
        sticky top-[var(--subnav-offset,0px)]
        backdrop-blur-md
        bg-white/50 dark:bg-black/50
        z-40
        overflow-hidden
      "
      role="navigation"
      aria-label="User quick navigation"
    >
      {/* ultra-slim bar */}
      <div
        className="
          container mx-auto
          px-3 sm:px-4
          flex items-center justify-between
          leading-none
        "
      >
        {/* Left: tiny welcome (ellipsis on overflow) */}
        <div className="min-w-0 flex items-center gap-2 text-[11px] sm:text-xs dark:text-white/80">
          <span className="inline-block size-1.5 rounded-full bg-emerald-400/80 shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
          <span className="truncate">
            Hi, <span className="font-medium dark:text-white">{name}</span>
          </span>
        </div>

        {/* Right: compact actions */}
        <div className="flex items-center gap-1.5">
          {isAdmin && (
            <Link
              href="/admin"
              className="
                group
                inline-flex items-center gap-1
                text-[11px] sm:text-xs
                dark:text-white/80 dark:hover:text-white
                ring-1 ring-white/10 hover:ring-white/20
                transition
                px-2
                focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40
              "
              title="Admin"
            >
              admin
            </Link>
          )}
          <Link
            href="/orders"
            className="
              group
              inline-flex items-center gap-1
              text-[11px] sm:text-xs
              dark:text-white/80 dark:hover:text-white
              ring-1 ring-white/10 hover:ring-white/20
              transition
              px-2
              focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40
            "
            title="View your orders"
          >
            my orders
          </Link>

          <button
            onClick={handleSignOut}
            className="
              group
              inline-flex items-center gap-1
              text-[11px] sm:text-xs
              dark:text-white/80 dark:hover:text-white
              ring-1 ring-white/10 hover:ring-white/20
              transition
              cursor-pointer
              px-2
              focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40
            "
            title="Sign out"
            aria-label="Sign out"
          >
            sign out
          </button>
        </div>
      </div>

      {/* razor accent line for that “sports car clock” vibe */}
      <div className="h-[2px] 
      w-full bg-gradient-to-r 
      dark:from-pink-300/40 dark:via-blue-400/60 dark:to-purple-400/30
      from-green-400/50 to-blue-400/60 via-orange-400/40
      " />
    </div>
  );
}
