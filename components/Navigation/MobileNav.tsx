"use client";
import React, { SetStateAction, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Container from "../shared/Container";
import { MenuIcon, X } from "lucide-react";

interface MobileNavProps {
  scrolled: boolean;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const MobileNav: React.FC<MobileNavProps> = ({ scrolled, open, setOpen }) => {
  return (
    <>
      {open && (
        <div className="fixed top-0 right-0 bottom-0 left-0 bg-gradient-to-b from-black via-black to-black/50 -z-10 backdrop-blur-md" />
      )}
      <nav
        className={`md:hidden backdrop-blur-md border transition-all duration-300 ${scrolled
            ? "bg-black/100 border-transparent rounded-lg"
            : "bg-black/50 border-black/20"
          }`}
      >
        <Container className="flex justify-between items-center h-16">
          <div
            className={`flex items-center gap-2 font-bold text-lg text-white`}
          >
            <Image
              src="/images/logo.png"
              alt="Zevlin Bike Logo"
              width={32}
              height={32}
            />
            Zevlin Bike
          </div>
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
            <Link href="/" className="block py-2 text-white">
              Home
            </Link>
            <Link href="/product/sample" className="block py-2 text-white">
              Products
            </Link>
            <Link href="/about" className="block py-2 text-white">
              About
            </Link>
            <Link href="/cart" className="block py-2 text-white">
              Cart
            </Link>
          </div>
        )}
      </nav>
    </>
  );
};

export default MobileNav;
