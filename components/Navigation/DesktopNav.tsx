"use client";
import React from "react";
import Link from "next/link";
import Container from "../shared/Container";
import Logo from "../Logo";
import { useCartStore } from "@/store/cartStore";

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

const DesktopNav: React.FC<DesktopNavProps> = ({ scrolled }) => {
  const cartItems = useCartStore((state) => state.items);
  return (
  <nav
    className={`hidden w-full md:block z-[100] transition-all duration-500 ${
      scrolled
        ? "bg-black  border-black/20 rounded-lg"
        : "bg-black border-transparent border rounded-none"
    }`}
  >
    <Container
      className={`flex justify-between items-center transition-all ${scrolled ? "h-12" : "h-20"}`}
    >
      <Logo
        className={`${scrolled ? "scale-100" : "scale-150 ml-8"} text-white`}
      />
      <div className={`flex items-center space-x-6 text-white`}>
        <Link href="/">Home</Link>
        <Link href="/products">Products</Link>
        <Link href="/about">About</Link>
        <Link href="/contact">Contact</Link>
        <Link href="/faq">FAQ</Link>
        <Link href="/blog">Blog</Link>
        <Link href="/cart" className="relative" aria-label="View Cart">
          {
            cartItems.length > 0 && (
              <span className="text-white absolute -translate-x-1/2 -translate-y-1/2 top-0 right-0 text-xs bg-red-500 rounded-full w-4 h-4 flex items-center justify-center">
                {cartItems.reduce((acc, item) => acc + item.quantity, 0)} {/* total quantity of items in cart */}
              </span>
            )
          }
          <CartIcon />
        </Link>
      </div>
    </Container>
  </nav>
  );
};

export default DesktopNav;
