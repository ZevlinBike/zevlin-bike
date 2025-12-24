import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next"
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import Navigation from "@/components/Navigation";
import { ThemeProvider } from "@/app/components/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import SocialFABs from "@/components/SocialFABs";
import { Analytics } from "@vercel/analytics/next"
import PendingNav from "@/app/components/PendingNav";
import RouteChrome from "@/app/components/RouteChrome";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zevlin Bike - Goods for your goods",
  description:
    "The ultimate cream to keep you riding better, harder, and longer.",
};
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: notices } = await supabase
    .from("notifications_active")
    .select("*")
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Analytics />
        <SpeedInsights />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* Public route pending navigation indicator and site chrome (hidden on receipt routes) */}
          <RouteChrome>
            <PendingNav />
            <Navigation user={user} notices={notices}/>
            <SocialFABs />
            <Toaster />
          </RouteChrome>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
