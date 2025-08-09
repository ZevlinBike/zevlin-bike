"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

function displayNameFromEmail(email: string) {
  const name = email.split("@")[0] ?? email;
  // Title-case first segment, keep the rest as typed
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export default function UserSubNav({ user }: { user: User }) {
  const router = useRouter();

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
        z-40
        mx-4 mt-1
        rounded-xl
        bg-black/60
        border border-white/10
        backdrop-blur
        shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset,0_8px_20px_rgba(0,0,0,0.25)]
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
          py-1
          flex items-center justify-between
          leading-none
        "
      >
        {/* Left: tiny welcome (ellipsis on overflow) */}
        <div className="min-w-0 flex items-center gap-2 text-[11px] sm:text-xs text-white/80">
          <span className="inline-block size-1.5 rounded-full bg-emerald-400/80 shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
          <span className="truncate">
            Hi, <span className="font-medium text-white">{name}</span>
          </span>
        </div>

        {/* Right: compact actions */}
        <div className="flex items-center gap-1.5">
          <Link
            href="/orders"
            className="
              group
              inline-flex items-center gap-1
              text-[11px] sm:text-xs
              text-white/80 hover:text-white
              px-2 py-1
              rounded-md
              ring-1 ring-white/10 hover:ring-white/20
              transition
              focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40
            "
            title="View your orders"
          >
            {/* Package icon (inline SVG, no deps) */}
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5 opacity-80 group-hover:opacity-100"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3 3 7l9 4 9-4-9-4Z" />
              <path d="M3 17l9 4 9-4" />
              <path d="M3 7v10m18-10v10M12 7v14" />
            </svg>
            <span className="hidden xs:inline">Orders</span>
          </Link>

          <button
            onClick={handleSignOut}
            className="
              inline-flex items-center justify-center
              h-7 w-7
              text-white/75 hover:text-white
              rounded-md
              ring-1 ring-white/10 hover:ring-white/20
              transition
              focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40
            "
            title="Sign out"
            aria-label="Sign out"
          >
            {/* Log out icon */}
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <path d="M10 17l5-5-5-5" />
              <path d="M15 12H3" />
            </svg>
          </button>
        </div>
      </div>

      {/* razor accent line for that “sports car clock” vibe */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </div>
  );
}

