"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

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

const CartButton: React.FC = () => {
  const currentLink = usePathname();
  if (currentLink === "/cart" || currentLink === "/checkout") return null;
  return (
    <Link
      href="/cart"
      className="fixed right-4 bottom-4 z-50 p-4 text-white bg-blue-600 rounded-full shadow-lg transition-colors md:hidden hover:bg-blue-700 focus:outline-none"
      aria-label="View Cart"
    >
      <CartIcon />
    </Link>
  );
};

export default CartButton;
