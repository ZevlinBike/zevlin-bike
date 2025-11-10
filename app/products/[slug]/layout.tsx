import type { ReactNode } from "react";
import { Unbounded, Manrope } from "next/font/google";

const display = Unbounded({ subsets: ["latin"], variable: "--font-product-display" });
const sans = Manrope({ subsets: ["latin"], variable: "--font-product-sans" });

export default function ProductSlugLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${display.variable} ${sans.variable} font-product-sans`}>{children}</div>
  );
}

