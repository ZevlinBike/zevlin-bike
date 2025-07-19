"use client";
import React, { useState, useEffect } from "react";
import DesktopNav from "./DesktopNav";
import MobileNav from "./MobileNav";
import NotificationBanner from "./NotificationBanner";

const Navigation: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-[100] duration-500 transition-all`}
      >
        <NotificationBanner scrolled={scrolled} />
        <div
          className={`${scrolled ? "p-4" : "p-0"} transition-all duration-500`}
        >
          <DesktopNav scrolled={scrolled} />
          <MobileNav open={open} setOpen={setOpen} scrolled={scrolled} />
        </div>
      </header>
    </>
  );
};

export default Navigation;
