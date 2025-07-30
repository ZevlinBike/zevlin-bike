import Footer from "@/app/components/Footer";
import { ReactNode } from "react";
import Navigation from "../Navigation";



export default function MainLayout({children}:{children:ReactNode}){
  return(
    <>
    <Navigation />
    <main className="min-h-screen text-black bg-gray-100 dark:bg-neutral-900 text-white">
      {children}
    </main>
    <Footer />
    </>
  )
}
