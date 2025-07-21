import Logo from "@/components/Logo";
import Link from "next/link";

export default function Footer() {
  return (
    // Darker, more premium background for the footer
    <footer className="py-16 text-gray-900 bg-gray-100">
      <div className="container px-4 mx-auto lg:px-6">
        <div className="grid gap-12 pb-8 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-6">
              <Logo className="text-black" />
            </div>
            <p className="text-sm leading-relaxed text-gray-400 dark:text-gray-500">
              Premium cycling products designed for real riders - Built for
              comfort, made to last.
            </p>
          </div>
          {/* Navigation Columns */}
          {[
            {
              title: "Products",
              links: [
                { name: "Chamois Cream", href: "/products?category=cream" },
                { name: "Cycling Apparel", href: "/products?category=apparel" },
                { name: "Limited Drops", href: "/products?category=limited" },
              ],
            },
            {
              title: "Support",
              links: [
                { name: "Contact Us", href: "/contact" },
                { name: "FAQ", href: "/faq" },
                { name: "Shipping Info", href: "/shipping" },
                { name: "Returns", href: "/returns" },
              ],
            },
            {
              title: "Company",
              links: [
                { name: "About Zevlin", href: "/about" },
                { name: "Our Mission", href: "/mission" },
                { name: "Privacy Policy", href: "/privacy" },
              ],
            },
          ].map((col, idx) => (
            <div key={idx}>
              <h4 className="mb-5 text-lg font-semibold text-black">
                {" "}
                {/* Larger, more prominent headings */}
                {col.title}
              </h4>
              <ul className="space-y-3 text-sm">
                {" "}
                {/* Increased space between links */}
                {col.links.map((link, linkIdx) => (
                  <li key={linkIdx}>
                    <Link
                      href={link.href}
                      className="transition-colors duration-200 hover:text-blue-400 dark:hover:text-blue-300" // Hover to brand blue
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Copyright Section */}
        <div className="pt-8 mt-8 text-sm text-center text-gray-500 border-t border-gray-700 dark:text-gray-600 dark:border-gray-800">
          {" "}
          {/* Softer text color, slightly darker border */}
          <p>
            &copy; {new Date().getFullYear()} Zevlin Bike. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
