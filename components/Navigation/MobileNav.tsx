"use client";
import React from "react";
import Link from "next/link";
import Container from "../shared/Container";
import { MenuIcon, X } from "lucide-react";
import CartButton from "../Cart/CartButton";
import Logo from "../Logo";

interface MobileNavProps {
  scrolled: boolean;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/about", label: "About" },
];

const MobileNav: React.FC<MobileNavProps> = ({ scrolled, open, setOpen }) => {
  return (
    <>
      <CartButton />
      {open && (
        <div className="fixed top-0 right-0 bottom-0 left-0 bg-gradient-to-b from-black via-black to-black/50 -z-10 backdrop-blur-md" />
      )}
      <nav
        className={`md:hidden backdrop-blur-md border transition-all duration-300 bg-black ${scrolled ? "border-transparent rounded-lg" : "border-black/20"
          }`}
      >
        <Container
          className={`flex justify-between items-center transition-all ${scrolled ? "h-12" : "h-24"}`}
        >
          <Logo className={scrolled ? "scale-100" : "scale-150 ml-8"} />
          <button onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
            {open ? (
              <>
                <X />
              </>
            ) : (
              <>
                <MenuIcon />
              </>
            )}
          </button>
        </Container>
        {open && (
          <div className="px-4 pb-4">
            {LINKS.map((link, linkIndex) => {
              return (
                <Link
                  key={`${link}${linkIndex}`}
                  href="/"
                  className="block py-2 text-2xl font-thin text-white"
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        )}
      </nav>
    </>
  );
};

export default MobileNav;
