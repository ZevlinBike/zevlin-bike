"use client";
import React from "react";
import Link from "next/link";
import Container from "../shared/Container";
import Logo from "../Logo";

const CartIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="feather feather-shopping-cart"
  >
    <circle cx="9" cy="21" r="1"></circle>
    <circle cx="20" cy="21" r="1"></circle>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
  </svg>
);

interface DesktopNavProps {
  scrolled: boolean;
}

const DesktopNav: React.FC<DesktopNavProps> = ({ scrolled }) => (
  <nav
    className={`hidden w-full md:block z-[100] transition-all duration-500 ${scrolled
        ? "bg-black/50 backdrop-blur-md border-black/20 rounded-lg"
        : "bg-black/100 border-transparent border rounded-none"
      }`}
  >
    <Container
      className={`flex justify-between items-center transition-all ${scrolled ? "h-12" : "h-16"}`}
    >
      <Logo />
      <div className={`flex items-center space-x-6 text-white`}>
        <Link href="/">Home</Link>
        <Link href="/product/sample">Products</Link>
        <Link href="/about">About</Link>
        <Link href="/cart" aria-label="View Cart">
          <CartIcon />
        </Link>
      </div>
    </Container>
  </nav>
);

export default DesktopNav;
