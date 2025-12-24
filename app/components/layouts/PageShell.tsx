"use client";

import Footer from "@/app/components/Footer";
import { ReactNode } from "react";

export default function PageShell({ children }: { children: ReactNode }) {
  return (
    <>
      <main className="min-h-screen pt-16 lg:pt-20 transition-all text-black bg-white dark:bg-black dark:text-white ">
        {children}
      </main>
      <Footer />
    </>
  );
}
