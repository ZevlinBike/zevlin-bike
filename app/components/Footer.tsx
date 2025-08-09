
import Logo from "@/components/Logo";
import Link from "next/link";

export default function Footer() {
  const columns = [
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
    {
      title: "🤫",
      links: [{ name: "Admin", href: "/admin" }],
    },
  ];

  return (
    <footer className="relative bg-gray-100 text-gray-900 dark:bg-neutral-950 dark:text-gray-100">
      {/* slim accent line (sports-dash vibe) */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-black/20 to-transparent dark:via-white/15" />

      <div className="container mx-auto px-4 lg:px-6">
        {/* top block */}
        <div className="py-12 sm:py-16">
          <div className="grid gap-10 sm:gap-12 md:grid-cols-2 lg:grid-cols-4">
            {/* brand blurb */}
            <div>
              <div className="mb-4">
                <Logo className="text-black dark:text-white" />
              </div>
              <p className="max-w-xs text-[13px] leading-relaxed text-gray-600 dark:text-gray-300">
                Premium cycling products designed for real riders — built for comfort, made to last.
              </p>
            </div>

            {/* nav columns */}
            {columns.map((col, idx) => (
              <nav key={idx} aria-label={col.title}>
                <h4 className="mb-4 text-sm font-semibold tracking-wide uppercase text-gray-800 dark:text-gray-100">
                  {col.title}
                </h4>
                <ul className="space-y-2.5 text-[13px]">
                  {col.links.map((link, i) => (
                    <li key={i}>
                      <Link
                        href={link.href}
                        className="
                          group inline-flex items-center gap-1
                          text-gray-600 hover:text-gray-900
                          dark:text-gray-300 dark:hover:text-white
                          transition
                          focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black/20 dark:focus-visible:ring-white/30 rounded
                        "
                      >
                        <span className="underline-offset-4 group-hover:underline">{link.name}</span>
                        {/* tiny chevron that fades in */}
                        <svg
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                          className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        {/* hairline separator with soft glow */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-black/10 to-transparent dark:via-white/10" />

        {/* bottom bar */}
        <div className="py-6 text-center">
          <p className="text-[12px] text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} Zevlin Bike. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

