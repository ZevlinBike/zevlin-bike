import Footer from "@/app/components/Footer";
import { ReactNode } from "react";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <main className="min-h-screen pt-6 text-black bg-gray-100 dark:bg-neutral-900 dark:text-white ">
        {children}
      </main>
      <Footer />
    </>
  );
}
