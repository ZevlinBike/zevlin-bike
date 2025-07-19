"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Mountain, Menu, X } from "lucide-react"
import Link from "next/link"

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-gray-900/95 backdrop-blur-md border-b border-gray-800 shadow-lg"
            : "bg-transparent"
        }`}
      >
        <div className="container flex justify-between items-center px-4 mx-auto h-16 lg:px-6">
          <div className="flex items-center space-x-2">
            <Mountain className="w-8 h-8 text-blue-400" />
            <span className="text-2xl font-bold">Zevlin Crack</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden items-center space-x-6 md:flex">
            <Link
              href="#products"
              className="text-gray-300 transition-colors hover:text-white"
            >
              Products
            </Link>
            <Link
              href="#about"
              className="text-gray-300 transition-colors hover:text-white"
            >
              About
            </Link>
            <Link
              href="#contact"
              className="text-gray-300 transition-colors hover:text-white"
            >
              Contact
            </Link>
            <Button
              variant="outline"
              className="text-blue-400 bg-transparent border-blue-400 hover:text-gray-900 hover:bg-blue-400"
            >
              Shop Now
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="p-2 text-white transition-colors md:hidden hover:text-blue-400"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-gray-900/80 backdrop-blur-md"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Menu Content */}
          <div className="flex relative flex-col h-full">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-700/50">
              <div className="flex items-center space-x-2">
                <Mountain className="w-8 h-8 text-blue-400" />
                <span className="text-2xl font-bold">Zevlin Crack</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-white transition-colors hover:text-blue-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex flex-col flex-1 justify-center px-6 space-y-8">
              <Link
                href="#products"
                className="pb-4 text-3xl font-light text-white border-b transition-colors hover:text-blue-400 border-gray-700/30"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Products
              </Link>
              <Link
                href="#about"
                className="pb-4 text-3xl font-light text-white border-b transition-colors hover:text-blue-400 border-gray-700/30"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link
                href="#contact"
                className="pb-4 text-3xl font-light text-white border-b transition-colors hover:text-blue-400 border-gray-700/30"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Contact
              </Link>

              {/* CTA Button */}
              <div className="pt-8">
                <Button
                  size="lg"
                  className="py-4 w-full text-lg text-white bg-blue-600 hover:bg-blue-700"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Shop Now
                </Button>
              </div>
            </nav>

            {/* Footer */}
            <div className="p-6 border-t border-gray-700/50">
              <p className="text-sm text-center text-gray-400">
                Premium climbing essentials for peak performance
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
