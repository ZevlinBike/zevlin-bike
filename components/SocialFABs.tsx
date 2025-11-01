"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

type SocialLink = {
  name: "Instagram" | "Facebook";
  href: string;
  icon: React.ReactNode;
};

const InstagramIcon = ({ className = "" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4.2" />
    <circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

const FacebookIcon = ({ className = "" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className={className}
    fill="currentColor"
  >
    <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.19 8.44 9.94v-6.93H8.1v-3h2.34V9.84c0-2.31 1.37-3.58 3.47-3.58.99 0 2.03.18 2.03.18v2.23h-1.14c-1.12 0-1.47.69-1.47 1.4v1.68h2.5l-.4 3h-2.1V22c4.78-.75 8.44-4.92 8.44-9.94Z" />
  </svg>
);

export default function SocialFABs() {
  const pathname = usePathname();

  const instagramUrl = process.env.NEXT_PUBLIC_INSTAGRAM_URL || "";
  const facebookUrl = process.env.NEXT_PUBLIC_FACEBOOK_URL || "";

  // Visible near top (<10%) or near bottom (>90%) of the page
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const calcAndSet = () => {
      const el = document.documentElement;
      const max = Math.max(1, el.scrollHeight - el.clientHeight);
      const pct = (el.scrollTop / max) * 100;
      const hiddenMid = pct >= 10 && pct <= 90;
      setIsVisible(!hiddenMid);
    };

    // Run once on mount
    calcAndSet();
    window.addEventListener("scroll", calcAndSet, { passive: true });
    window.addEventListener("resize", calcAndSet);
    return () => {
      window.removeEventListener("scroll", calcAndSet as EventListener);
      window.removeEventListener("resize", calcAndSet as EventListener);
    };
  }, []);

  const links: SocialLink[] = useMemo(() => {
    const arr: SocialLink[] = [];
    if (instagramUrl) {
      arr.push({
        name: "Instagram",
        href: instagramUrl,
        icon: <InstagramIcon className="size-4" />,
      });
    }
    if (facebookUrl) {
      arr.push({
        name: "Facebook",
        href: facebookUrl,
        icon: <FacebookIcon className="size-4" />,
      });
    }
    return arr;
  }, [instagramUrl, facebookUrl]);

  // Hide on any /admin route
  if (pathname?.startsWith("/admin")) return null;

  // If no links configured, render nothing
  if (links.length === 0) return null;

  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={isVisible ? { x: 0, opacity: 1, scale: 1 } : { x:100, opacity: 0.5, scale: 0.95 }}
      transition={
        isVisible
          ? { type: "spring", stiffness: 320, damping: 22, bounce: 0.3 }
          : { duration: 0.2, ease: "easeOut" }
      }
      className={[
        "fixed right-0 md:scale-100 top-1/2 sm:bottom-6 z-50",
        "transition-all duration-300",
        isVisible ? "pointer-events-auto" : "pointer-events-none",
      ].join(" ")}
    >
      <div className="group relative">
        <div
          className={[
            "grid items-center gap-2",
            "rounded-l-lg ",
            "backdrop-blur-xl pl-1 group-hover:pr-20 ",
            // Light / dark glass
            "bg-black shadow-[0_4px_20px_-8px_rgba(0,0,0,0.25)]",
            // Subtle hover lift
            "transition-all duration-300",
          ].join(" ")}
        >


          {links.map((l) => (
            <a
              key={l.name}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={l.name}
              className={[
                "inline-flex justify-self-center size-7 items-center justify-center",
                "text-white",
                "transition-all duration-200",
                "flex gap-2 group",
              ].join(" ")}
            >
              {l.icon}
              <p className=" max-w-0 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all group-hover:max-w-auto">{l.name}</p>
            </a>
          ))}

        </div>
      </div>
    </motion.div>
  );
}
