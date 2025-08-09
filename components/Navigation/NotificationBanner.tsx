import Link from "next/link";
import { ArrowRight, X, ArrowDown } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function NotificationBanner({ scrolled }: { scrolled: boolean }) {
  const [closed, setClosed] = useState(false);
  const isBannerVisible = !closed && !scrolled;

  return (
    <>
      {/* Re-open Button */}
      <AnimatePresence>
        {closed && !scrolled && (
          <motion.button
            key="reopen-button"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.25 }}
            onClick={() => setClosed(false)}
            className="
              absolute top-0 left-1/2 -translate-x-1/2 z-20
              px-2 py-1
              bg-gradient-to-b from-red-700 to-red-800
              rounded-b-lg shadow-lg
              text-white
              hover:brightness-110
              transition
            "
            aria-label="Show announcement"
          >
            <ArrowDown className="h-4 w-4" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Main Banner */}
      <AnimatePresence>
        {isBannerVisible && (
          <motion.div
            key="notification-banner"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 40, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.45, ease: "easeInOut" }}
            className="
              flex overflow-hidden relative
              justify-center items-center
              bg-gradient-to-r from-red-700 via-red-600 to-red-800
              text-white
              shadow-md
            "
          >
            <div className="container px-3 mx-auto sm:px-6 lg:px-8">
              <div className="flex items-center justify-between gap-2 h-10">
                {/* Message */}
                <p
                  className="
                    flex-1 min-w-0
                    text-[12px] sm:text-sm
                    font-medium
                    truncate
                  "
                  title="New Products Coming Soon"
                >
                  <span className="hidden mr-2 font-black uppercase sm:inline-block">
                    Big News!
                  </span>
                  New Products Coming Soon
                </p>

                {/* CTA */}
                <Link
                  href="/new-products"
                  className="
                    flex-shrink-0
                    inline-flex items-center
                    h-7 px-2 sm:px-3
                    rounded-md bg-white/10 hover:bg-white/20
                    text-[11px] sm:text-xs font-semibold
                    transition
                  "
                >
                  <span className="hidden xs:inline">Learn More</span>
                  <ArrowRight className=" h-3.5 w-3.5" />
                </Link>

                {/* Close */}
                <button
                  onClick={() => setClosed(true)}
                  className="
                    flex-shrink-0
                    inline-flex items-center justify-center
                    h-7 w-7
                    rounded-md hover:bg-black/20
                    transition
                  "
                  aria-label="Close banner"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

