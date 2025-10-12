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
  LogOut,
  Menu,
  X,
  Newspaper,
  ChevronDown,
  ChevronRight
} from "lucide-react";
//
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import GlobalSearch from "./components/GlobalSearch";
import Logo from "@/components/Logo";

import type { ElementType } from 'react';
type NavItem = { name: string; href: string; icon?: ElementType };
type NavGroup = { label: string; icon: ElementType; items: NavItem[] };

const navGroups: NavGroup[] = [
  {
    label: "Orders",
    icon: ShoppingCart,
    items: [
      { name: "Orders", href: "/admin/orders" },
      { name: "Fulfillment", href: "/admin/fulfillment" },
      { name: "Refunds", href: "/admin/refunds" },
      { name: "Invoices", href: "/admin/invoices" },
      { name: "Activity", href: "/admin/activity" },
    ],
  },
  {
    label: "Customers",
    icon: Users,
    items: [
      { name: "Customers", href: "/admin/customers" },
      { name: "Newsletter", href: "/admin/newsletter" },
    ],
  },
  {
    label: "Inventory",
    icon: Package,
    items: [
      { name: "Products", href: "/admin/products" },
      { name: "Categories", href: "/admin/categories" },
      { name: "Discounts", href: "/admin/discounts" },
    ],
  },
  {
    label: "Website",
    icon: Newspaper,
    items: [
      { name: "Blog", href: "/admin/blog" },
      { name: "Announcements", href: "/admin/announcements" },
      { name: "Functions", href: "/admin/functions" },
      { name: "Testing", href: "/admin/testing" },
      { name: "Settings", href: "/admin/settings" },
    ],
  },
];

function AdminShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userFirstName, setUserFirstName] = useState<string | null>(null);
  const [userLastName, setUserLastName] = useState<string | null>(null);
  const [navCounts, setNavCounts] = useState<{ refunds: number; toFulfill: number; openOrders: number }>({ refunds: 0, toFulfill: 0, openOrders: 0 });

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      const email = data.user?.email ?? null;
      const authUserId = data.user?.id ?? null;
      setUserEmail(email);
      if (authUserId) {
        const { data: customer } = await supabase
          .from('customers')
          .select('first_name,last_name,email')
          .eq('auth_user_id', authUserId)
          .maybeSingle();
        if (customer) {
          setUserFirstName(customer.first_name || null);
          setUserLastName(customer.last_name || null);
          setUserEmail(customer.email || email);
        }
      }
    };
    fetchUser();
  }, [supabase]);

  const displayName = (userFirstName
    ? `${userFirstName}${userLastName ? ` ${userLastName.charAt(0)}.` : ''}`
    : 'Admin');
  const avatarLetter = (userFirstName?.[0] || userEmail?.[0] || 'A').toUpperCase();

  // Expand the group that matches the current path
  useEffect(() => {
    const current = navGroups.find((g) => g.items.some((it) => pathname.startsWith(it.href)));
    if (current && !openGroups[current.label]) {
      setOpenGroups((prev) => ({ ...prev, [current.label]: true }));
    }
  }, [pathname, openGroups]);

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
          .eq('order_status', 'pending_fulfillment')
          .eq('is_training', false);

        // Open orders (pending payment or fulfillment)
        const { count: openOrdersCount } = await supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .in('order_status', ['pending_payment', 'pending_fulfillment'])
          .eq('is_training', false);

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
                <div className="flex flex-col">
                  <h1 className="text-base font-bold text-neutral-900 dark:text-white">{displayName}</h1>
                  {userEmail && (
                    <span className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate max-w-[180px]">{userEmail}</span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>
              <nav className="flex-1 space-y-1 px-2 py-4">
                {/* Dashboard link */}
                <Link
                  href="/admin"
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    pathname === '/admin'
                      ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-white'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <LayoutDashboard className="mr-3 h-5 w-5" />
                  Dashboard
                </Link>

                {navGroups.map((group) => {
                  const open = !!openGroups[group.label];
                  const Icon = group.icon;
                  return (
                    <div key={group.label} className="">
                      <button
                        className={`w-full flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                          open
                            ? 'bg-neutral-100 text-neutral-900 dark:bg-neutral-700 dark:text-white'
                            : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-white'
                        }`}
                        onClick={() => setOpenGroups((prev) => ({ ...prev, [group.label]: !open }))}
                      >
                        <Icon className="mr-3 h-5 w-5" />
                        {group.label}
                        {open ? <ChevronDown className="ml-auto h-4 w-4" /> : <ChevronRight className="ml-auto h-4 w-4" />}
                      </button>
                      {open && (
                        <div className="mt-1 ml-8 space-y-1">
                          {group.items.map((item) => {
                            const isActive = pathname.startsWith(item.href);
                            const badge =
                              item.href === '/admin/refunds' ? navCounts.refunds :
                              item.href === '/admin/fulfillment' ? navCounts.toFulfill :
                              item.href === '/admin/orders' ? navCounts.openOrders : 0;
                            return (
                              <Link
                                key={item.name}
                                href={item.href}
                                className={`group flex items-center px-2 py-1.5 text-sm rounded-md transition-colors ${
                                  isActive
                                    ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
                                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-white'
                                }`}
                                onClick={() => setSidebarOpen(false)}
                              >
                                <span>{item.name}</span>
                                {badge > 0 && (
                                  <span className="ml-auto inline-flex items-center justify-center rounded-full bg-blue-600 text-white text-xs px-2 py-0.5 min-w-5">{badge}</span>
                                )}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
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
            <h1 className="text-xl font-bold text-neutral-900 dark:text-white relative">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-100">
                {displayName}
              </span>
              <span className="absolute left-1/2 -translate-x-1/2 group-hover:opacity-0 transition-opacity duration-200">
                {avatarLetter}
              </span>
            </h1>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {/* Dashboard link */}
            <Link
              href="/admin"
              title="Dashboard"
              className={`flex items-center justify-center lg:justify-start px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                pathname === '/admin'
                  ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-white'
              }`}
            >
              <LayoutDashboard className="h-5 w-5 shrink-0" />
              <span className="ml-3 hidden group-hover:inline-flex transition-opacity duration-200 delay-100 flex-1">Dashboard</span>
            </Link>

            {navGroups.map((group) => {
              const open = !!openGroups[group.label];
              const Icon = group.icon;
              // group is active if any child matches
              const groupActive = group.items.some((it) => pathname.startsWith(it.href));
              return (
                <div key={group.label}>
                  <button
                    title={group.label}
                    className={`w-full flex items-center justify-center lg:justify-start px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      groupActive
                        ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
                        : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-white'
                    }`}
                    onClick={() => setOpenGroups((prev) => ({ ...prev, [group.label]: !open }))}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="ml-3 hidden group-hover:flex transition-opacity duration-200 delay-100 flex-1 items-center">
                      <span>{group.label}</span>
                      {open ? (
                        <ChevronDown className="ml-auto h-4 w-4" />
                      ) : (
                        <ChevronRight className="ml-auto h-4 w-4" />
                      )}
                    </span>
                  </button>
                  {open && (
                    <div className="mt-1 ml-9 space-y-1 hidden group-hover:block">
                      {group.items.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        const badge =
                          item.href === '/admin/refunds' ? navCounts.refunds :
                          item.href === '/admin/fulfillment' ? navCounts.toFulfill :
                          item.href === '/admin/orders' ? navCounts.openOrders : 0;
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            title={item.name}
                            className={`flex items-center justify-center lg:justify-start px-3 py-1.5 text-sm rounded-md transition-colors ${
                              isActive
                                ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
                                : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-white'
                            }`}
                          >
                            <span className="hidden group-hover:flex transition-opacity duration-200 delay-100 flex-1 items-center">
                              <span>{item.name}</span>
                              {badge > 0 && (
                                <span className="ml-auto inline-flex items-center justify-center rounded-full bg-blue-600 text-white text-xs px-2 py-0.5 min-w-5">{badge}</span>
                              )}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
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
                  {avatarLetter}
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-300 max-w-[220px] truncate">
                  {displayName}{userEmail ? ` · ${userEmail}` : ''}
                </div>
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
