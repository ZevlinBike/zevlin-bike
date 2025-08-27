"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkAdminRole } from "@/app/auth/actions";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Settings, 
  LogOut,
  Menu,
  X,
  Newspaper,
  Megaphone,
  Ticket,
  Truck,
  Tags,
  Mail,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import GlobalSearch from "./components/GlobalSearch";
import Logo from "@/components/Logo";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Fulfillment", href: "/admin/fulfillment", icon: Truck },
  { name: "Products", href: "/admin/products", icon: Package },
  { name: "Categories", href: "/admin/categories", icon: Tags },
  { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { name: "Refunds", href: "/admin/refunds", icon: RefreshCw },
  { name: "Customers", href: "/admin/customers", icon: Users },
  { name: "Discounts", href: "/admin/discounts", icon: Ticket },
  { name: "Blog", href: "/admin/blog", icon: Newspaper },
  { name: "Announcements", href: "/admin/announcements", icon: Megaphone },
  { name: "Newsletter", href: "/admin/newsletter", icon: Mail },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

function AdminShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [navCounts, setNavCounts] = useState<{ refunds: number; toFulfill: number; openOrders: number }>({ refunds: 0, toFulfill: 0, openOrders: 0 });

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUserEmail(data.user?.email ?? null);
    };
    fetchUser();
  }, [supabase]);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        // Pending refunds
        const { count: refundsCount } = await supabase
          .from('refunds')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending');

        // Orders to fulfill
        const { count: fulfillCount } = await supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('order_status', 'pending_fulfillment');

        // Open orders (pending payment or fulfillment)
        const { count: openOrdersCount } = await supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .in('order_status', ['pending_payment', 'pending_fulfillment']);

        setNavCounts({
          refunds: refundsCount ?? 0,
          toFulfill: fulfillCount ?? 0,
          openOrders: openOrdersCount ?? 0,
        });
      } catch (e) {
        // Non-fatal; keep counts at 0
        console.warn('Failed to fetch admin nav counts', e);
      }
    };
    fetchCounts();
    // periodic refresh while on admin UI
    const id = setInterval(fetchCounts, 30_000);
    return () => clearInterval(id);
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const sidebarVariants = {
    open: { x: 0 },
    closed: { x: "-100%" },
  };

  const backdropVariants = {
    open: { opacity: 1 },
    closed: { opacity: 0 },
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-black dark:text-white">
      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              variants={backdropVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="fixed inset-0 bg-neutral-600 bg-opacity-75"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              variants={sidebarVariants}
              initial="closed"
              animate="open"
              exit="closed"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white dark:bg-neutral-800"
            >
              <div className="flex h-16 items-center justify-between px-4">
                <h1 className="text-xl font-bold text-neutral-900 dark:text-white">Admin</h1>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>
              <nav className="flex-1 space-y-1 px-2 py-4">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
                          : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-white'
                      }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon className="mr-3 h-5 w-5" />
                      {item.name}
                      {(item.href === '/admin/refunds' && navCounts.refunds > 0) && (
                        <span className="ml-auto inline-flex items-center justify-center rounded-full bg-blue-600 text-white text-xs px-2 py-0.5 min-w-5">{navCounts.refunds}</span>
                      )}
                      {(item.href === '/admin/fulfillment' && navCounts.toFulfill > 0) && (
                        <span className="ml-auto inline-flex items-center justify-center rounded-full bg-blue-600 text-white text-xs px-2 py-0.5 min-w-5">{navCounts.toFulfill}</span>
                      )}
                      {(item.href === '/admin/orders' && navCounts.openOrders > 0) && (
                        <span className="ml-auto inline-flex items-center justify-center rounded-full bg-blue-600 text-white text-xs px-2 py-0.5 min-w-5">{navCounts.openOrders}</span>
                      )}
                    </Link>
                  );
                })}
              </nav>
              <div className="border-t border-neutral-200 dark:border-neutral-700 p-4 space-y-2">
                <Link href="/" className="block">
                  <Button variant="ghost" className="w-full justify-start text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white">
                    Back to site
                  </Button>
                </Link>
                <Button variant="ghost" className="w-full justify-start text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white" onClick={handleSignOut}>
                  <LogOut className="mr-3 h-5 w-5" />
                  Sign Out
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <div className="group hidden lg:fixed lg:inset-y-0 lg:flex lg:w-20 hover:lg:w-64 lg:flex-col transition-all duration-300 ease-in-out z-50">
        <div className="flex flex-col flex-grow bg-white dark:bg-neutral-800 border-r border-neutral-200 dark:border-neutral-700 overflow-y-auto">
          <div className="flex h-16 items-center justify-center px-4 shrink-0">
            <h1 className="text-xl font-bold text-neutral-900 dark:text-white">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-100">Admin</span>
              <span className="absolute left-1/2 -translate-x-1/2 group-hover:opacity-0 transition-opacity duration-200">A</span>
            </h1>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={item.name}
                  className={`flex items-center justify-center lg:justify-start px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-white'
                  }`}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-100 flex-1 flex items-center">
                    <span>{item.name}</span>
                    {(item.href === '/admin/refunds' && navCounts.refunds > 0) && (
                      <span className="ml-auto inline-flex items-center justify-center rounded-full bg-blue-600 text-white text-xs px-2 py-0.5 min-w-5">{navCounts.refunds}</span>
                    )}
                    {(item.href === '/admin/fulfillment' && navCounts.toFulfill > 0) && (
                      <span className="ml-auto inline-flex items-center justify-center rounded-full bg-blue-600 text-white text-xs px-2 py-0.5 min-w-5">{navCounts.toFulfill}</span>
                    )}
                    {(item.href === '/admin/orders' && navCounts.openOrders > 0) && (
                      <span className="ml-auto inline-flex items-center justify-center rounded-full bg-blue-600 text-white text-xs px-2 py-0.5 min-w-5">{navCounts.openOrders}</span>
                    )}
                  </span>
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-neutral-200 dark:border-neutral-700 p-2 mt-auto shrink-0 space-y-1">
            <Link href="/" className="block">
              <Button variant="ghost" className="w-full justify-center lg:justify-start text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white px-3">
                <span className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-100">Back to site</span>
              </Button>
            </Link>
            <Button variant="ghost" className="w-full justify-center lg:justify-start text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white px-3" onClick={handleSignOut}>
              <LogOut className="h-5 w-5 shrink-0" />
              <span className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-100">Sign Out</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-20">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <Separator orientation="vertical" className="h-6 lg:hidden" />
          <div className="flex flex-1 items-center justify-between gap-4 self-stretch">
            {/* Left: brand */}
            <div className="flex items-center gap-3">
              <Logo className="text-black dark:text-white" />
              <span className="hidden sm:inline text-sm px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-100">Admin</span>
            </div>
            {/* Middle: global search */}
            <div className="hidden md:flex flex-1 max-w-xl relative">
              <GlobalSearch />
            </div>
            {/* Right: controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                  {(userEmail?.[0] || "A").toUpperCase()}
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-300 max-w-[180px] truncate">{userEmail || "Admin"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="py-6"
        >
          <div className="mx-auto max-w-7xl px-4 ">
            {children}
          </div>
        </motion.main>
      </div>
    </div>
  );
}


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isVerified, setIsVerified] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const verifyAdmin = async () => {
      const { isAdmin } = await checkAdminRole();
      if (!isAdmin) {
        router.push("/");
      } else {
        setIsVerified(true);
      }
    };
    verifyAdmin();
  }, [router]);

  if (!isVerified) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <Loader2 className="mb-3 h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm text-neutral-600 dark:text-neutral-300">Verifying admin access...</p>
      </div>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}
