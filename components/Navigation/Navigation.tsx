"use client";
import React, { useState, useEffect } from "react";
import DesktopNav from "./DesktopNav";
import MobileNav from "./MobileNav";
import NotificationBanner from "./NotificationBanner";
import UserSubNav from "./UserSubNav";
import { User } from "@supabase/supabase-js";
import { usePathname } from "next/navigation";
import { Notification } from "@/lib/schema";

export type NavLink = { href: string; label: string };

const Navigation = ({ user, notices } : { user:User | null, notices: Notification[] | null }) => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const path = usePathname();

  // Single source of truth for top-level navigation links
  const LINKS: NavLink[] = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Products" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
    { href: "/blog", label: "Blog" },
    // { href: "/mission", label: "Mission" },
    // { href: "/faq", label: "FAQ" },
    // { href: "/privacy", label: "Privacy" },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 75);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (path.startsWith("/admin")) return null

  return (
    <>
      <NotificationBanner scrolled={scrolled} notices={notices || []}/>
      <header
        className={`fixed ${scrolled ? "top-3" : "top-5.5"} left-3 right-3 rounded-lg overflow-visible z-[100] duration-500 transition-all`}
      >
        <div
          className={`${scrolled ? "p-0 rounded-t-lg" : "p-0 rounded-t-none"} rounded-lg transition-all duration-500 `}
        >
          <DesktopNav userMenuActive={user?true:false} scrolled={scrolled} links={LINKS} />
          <MobileNav userMenuActive={user?true:false} open={open} setOpen={setOpen} scrolled={scrolled} links={LINKS} />
        {user && !open && <UserSubNav user={user} />}
        </div>
      </header>
    </>
  );
};

export default Navigation;
