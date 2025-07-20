import Logo from "@/components/Logo";
import Link from "next/link";

export default function Footer() {
  return (
    // Darker, more premium background for the footer
    <footer className="py-16 text-gray-300 bg-gray-900 dark:text-gray-400 dark:bg-black">
      <div className="container px-4 mx-auto lg:px-6">
        <div className="grid gap-12 pb-8 md:grid-cols-2 lg:grid-cols-4">
          {" "}
          {/* Increased gap and added bottom padding */}
          {/* Company Info / Logo Column */}
          <div>
            <div className="mb-6">
              {" "}
              {/* Increased bottom margin for logo */}
              {/* Assuming Logo component handles its own coloring based on context,
                  if not, you might need to adjust it or pass a prop for dark mode.
                  If it currently inverts for light background, it should look right on dark. */}
              <Logo className="" />{" "}
              {/* Removed invert here as it's now on a dark background */}
            </div>
            <p className="text-sm leading-relaxed text-gray-400 dark:text-gray-500">
              {" "}
              {/* Slightly softer text color, relaxed line height */}
              Premium cycling products designed for real riders — from chamois
              cream to bar tape and more. Built for comfort, made to last.
            </p>
          </div>
          {/* Navigation Columns */}
          {[
            {
              title: "Products",
              links: [
                { name: "Chamois Cream", href: "#" },
                { name: "Handlebar Tape", href: "#" },
                { name: "Cycling Apparel", href: "#" },
                { name: "Limited Drops", href: "#" },
              ],
            },
            {
              title: "Support",
              links: [
                { name: "Contact Us", href: "#" },
                { name: "FAQ", href: "#" },
                { name: "Shipping Info", href: "#" },
                { name: "Returns", href: "#" },
              ],
            },
            {
              title: "Company",
              links: [
                { name: "About Zevlin", href: "#" },
                { name: "Our Mission", href: "#" },
                { name: "Privacy Policy", href: "#" },
                { name: "Terms of Service", href: "#" },
              ],
            },
          ].map((col, idx) => (
            <div key={idx}>
              <h4 className="mb-5 text-lg font-semibold text-white dark:text-gray-200">
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
