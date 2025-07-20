import Link from "next/link";
import { ArrowRight, X, ArrowDown } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion"; // Import motion and AnimatePresence

export default function NotificationBanner({
  scrolled,
}: {
  scrolled: boolean;
}) {
  const [closed, setClosed] = useState(false);

  // Determine if the banner should be visible based on scrolled state and closed state
  const isBannerVisible = !closed && !scrolled;

  return (
    <>
      {/* Re-open Button: Now uses Framer Motion for smoother reveal/hide */}
      <AnimatePresence>
        {closed && (
          <motion.button
            key="reopen-button" // Required for AnimatePresence
            initial={{ opacity: 0, y: -50 }} // Start slightly above and invisible
            animate={{ opacity: 1, y: 0 }} // Animate to visible and normal position
            exit={{ opacity: 0, y: -50 }} // Animate out
            transition={{ duration: 0.3 }} // Fast transition for the button
            onClick={() => setClosed(false)}
            // Positioned outside the banner flow, but still centered at the top
            className="absolute top-0 left-1/2 z-20 py-1 px-3 bg-blue-600 rounded-b-lg shadow-lg transition-colors -translate-x-1/2 hover:bg-blue-700"
          >
            <ArrowDown className="w-4 h-4 text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Main Notification Banner: Uses Framer Motion for height/slide animation */}
      <AnimatePresence>
        {isBannerVisible && (
          <motion.div
            key="notification-banner" // Required for AnimatePresence
            initial={{ height: 0, opacity: 0 }} // Start collapsed and invisible
            animate={{ height: 40, opacity: 1 }} // Animate to full height (h-10 = 40px) and visible
            exit={{ height: 0, opacity: 0 }} // Animate back to collapsed and invisible
            transition={{ duration: 0.5, ease: "easeInOut" }} // Smooth transition
            className="flex overflow-hidden relative justify-center items-center text-white whitespace-nowrap bg-gradient-to-r from-red-700 via-red-600 to-red-800"
            // The actual height comes from Framer Motion, not directly from Tailwind h-class
            // Ensure no conflicting height classes here.
          >
            <div className="container px-4 mx-auto sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-2">
                {/* Content aligned left, close button right */}
                <p className="text-sm font-medium">
                  <span className="hidden mr-3 font-black uppercase sm:inline-block">
                    Big News!
                  </span>{" "}
                  New Products Coming Soon
                </p>
                <Link
                  href="/new-products"
                  className="flex items-center ml-auto text-sm font-semibold hover:underline" // ml-auto pushes it right
                >
                  Learn More
                  <ArrowRight className="ml-1 w-4 h-4" />
                </Link>
                {/* Close Button: Placed directly next to content for better accessibility */}
                <button
                  onClick={() => setClosed(true)}
                  className="p-1 ml-4 rounded-full transition-colors hover:bg-red-800" // Added padding and hover
                  aria-label="Close banner"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
