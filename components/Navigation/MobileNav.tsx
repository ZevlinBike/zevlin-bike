"use client";
import React from "react";
import Link from "next/link";
import Container from "../shared/Container";
import { MenuIcon, X } from "lucide-react";
import CartButton from "../Cart/CartButton";
import Logo from "../Logo";
import { motion, AnimatePresence, Variants } from "framer-motion"; // Import motion and AnimatePresence

import type { NavLink } from "./Navigation";

interface MobileNavProps {
  scrolled: boolean;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  links: NavLink[];
}

const MobileNav: React.FC<MobileNavProps> = ({ scrolled, open, setOpen, links }) => {
  // Variants for the mobile menu panel
  const menuVariants: Variants = {
    closed: {
      y: "-100%", // Start off-screen above
      transition: {
        type: "tween", // Simple, direct animation
        duration: 0.4,
      },
    },
    open: {
      y: "0%", // Slide into view
      transition: {
        type: "tween",
        duration: 0.4,
        when: "beforeChildren", // Animate the container before its children
        staggerChildren: 0.08, // Stagger children animation
      },
    },
  };

  // Variants for individual menu links
  const linkVariants: Variants = {
    closed: { opacity: 0, y: -20 },
    open: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <>
      <CartButton />
      {/* Use AnimatePresence for the overlay to animate its mount/unmount */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed top-0 right-0 bottom-0 left-0 bg-gradient-to-b from-black via-black to-black/50 z-40 backdrop-blur-md"
          />
        )}
      </AnimatePresence>

      <nav
        // Removed dynamic background classes from <nav> for Framer Motion to control
        className={`md:hidden relative z-50 backdrop-blur-md border transition-all duration-300 bg-black ${
          scrolled ? "border-transparent" : "border-black/20"
        }`}
      >
        <Container
          className={`flex justify-between items-center transition-all ${
            scrolled ? "h-12" : "h-18"
          }`}
        >
          <Link href="/">
            <Logo className={`${scrolled ? "scale-100" : "scale-125 ml-4"} text-white`} />
          </Link>
          <button onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
            {/* Use AnimatePresence for the icon transition */}
            <AnimatePresence mode="wait" initial={false}>
              {open ? (
                <motion.div
                  key="x" // Unique key for AnimatePresence
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="text-white" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu" // Unique key for AnimatePresence
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <MenuIcon className="text-white" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </Container>

        {/* Use motion.div for the collapsible menu content */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial="closed"
              animate="open"
              exit="closed" // This is key for animating out
              variants={menuVariants}
              className="absolute left-0 top-full z-50 px-6 pb-4 w-full bg-gradient-to-b from-black to-transparent" // Add absolute positioning
            >
              {links.map((link) => {
                return (
                  <motion.div key={link.href} variants={linkVariants}>
                    {" "}
                    {/* Wrap Link in motion.div for individual animation */}
                    <Link
                      href={link.href}
                      className="block py-2 text-2xl font-thin text-white"
                      onClick={() => setOpen(false)} // Close menu on link click
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
};

export default MobileNav;
