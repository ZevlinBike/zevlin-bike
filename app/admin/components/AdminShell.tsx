"use client";

import { useEffect, useState, type ElementType } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import PendingNav from "../components/PendingNav";
import GlobalSearch from "../components/GlobalSearch";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
  ChevronRight,
} from "lucide-react";

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
      { name: "Analytics", href: "/admin/analytics" },
      { name: "Blog", href: "/admin/blog" },
      { name: "Announcements", href: "/admin/announcements" },
      { name: "Functions", href: "/admin/functions" },
      { name: "Testing", href: "/admin/testing" },
      { name: "Settings", href: "/admin/settings" },
    ],
  },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  // Render only after client mounts to avoid SSR/CSR mismatches
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userFirstName, setUserFirstName] = useState<string | null>(null);
  const [userLastName, setUserLastName] = useState<string | null>(null);
  const [navCounts, setNavCounts] = useState<{ refunds: number; toFulfill: number; openOrders: number; inTransit: number }>({ refunds: 0, toFulfill: 0, openOrders: 0, inTransit: 0 });

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

  useEffect(() => {
    const current = navGroups.find((g) => g.items.some((it) => pathname.startsWith(it.href)));
    if (current && !openGroups[current.label]) {
      setOpenGroups((prev) => ({ ...prev, [current.label]: true }));
    }
  }, [pathname, openGroups]);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const { count: refundsCount } = await supabase
          .from('refunds')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending');

        const { count: fulfillCount } = await supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('order_status', 'pending_fulfillment')
          .eq('is_training', false);

        const { count: openOrdersCount } = await supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .in('order_status', ['pending_payment', 'pending_fulfillment'])
          .eq('is_training', false);

        const { count: inTransitCount } = await supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('shipping_status', 'shipped')
          .eq('is_training', false);

        setNavCounts({
          refunds: refundsCount ?? 0,
          toFulfill: fulfillCount ?? 0,
          openOrders: openOrdersCount ?? 0,
          inTransit: inTransitCount ?? 0,
        });
      } catch (e) {
        console.warn('Failed to fetch admin nav counts', e);
      }
    };
    fetchCounts();
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
  } as const;

  const backdropVariants = {
    open: { opacity: 1 },
    closed: { opacity: 0 },
  } as const;

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 text-black dark:text-white overflow-x-hidden">
      <PendingNav />
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
                <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>
                  <X className="h-6 w-6" />
                </Button>
              </div>
              <nav className="flex-1 space-y-1 px-2 py-4">
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
                    <div key={group.label}>
                      <button
                        className={`w-full flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                          open
                            ? 'bg-neutral-100 text-neutral-900 dark:bg-neutral-700 dark:text-white'
                            : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-white'
                        }`}
                        onClick={() => setOpenGroups((prev) => ({ ...prev, [group.label]: !open }))}
                      >
                        <Icon className="mr-3 h-5 w-5" />
                        <span className="flex-1 text-left">{group.label}</span>
                        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                      {open && (
                        <div className="ml-8 mt-1 space-y-1">
                          {group.items.map((item) => (
                            <Link
                              key={item.name}
                              href={item.href}
                              className={`group flex items-center px-2 py-2 text-sm rounded-md transition-colors ${
                                pathname.startsWith(item.href)
                                  ? 'text-blue-600 dark:text-blue-300'
                                  : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white'
                              }`}
                              onClick={() => setSidebarOpen(false)}
                            >
                              {item.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex min-h-screen">
        {/* Sidebar (desktop, collapsible) */}
        <aside
          className="hidden lg:flex lg:flex-col lg:border-r lg:border-neutral-200 dark:lg:border-neutral-800 bg-white dark:bg-neutral-900 h-[100dvh] min-h-[640px] fixed top-0 left-0 lg:w-16 group hover:lg:w-64 transition-[width] duration-300 ease-in-out peer overflow-hidden z-40"
        >
          <div className="flex h-16 items-center px-4">
            <Link href="/admin" className="flex items-center gap-2 w-full">
              <Logo className="h-6 w-6 shrink-0" showText={false} />
              <span className="ml-2 whitespace-nowrap overflow-hidden transition-all duration-200 lg:w-0 group-hover:lg:w-auto">
                <span className="font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200">Admin</span>
              </span>
            </Link>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto min-w-0">
            <Link
              href="/admin"
              title="Dashboard"
              className={`flex items-center justify-center lg:justify-start px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                pathname === '/admin'
                  ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-white'
              }`}
            >
              <LayoutDashboard className="h-5 w-5 shrink-0" />
              <span className="ml-3 hidden group-hover:inline">Dashboard</span>
            </Link>
            {navGroups.map((group) => {
              const open = !!openGroups[group.label];
              const Icon = group.icon;
              const groupActive = group.items.some((it) => pathname.startsWith(it.href));
              return (
                <div key={group.label}>
                  <button
                    title={group.label}
                    className={`w-full flex items-center justify-center lg:justify-start px-2 py-2 text-sm font-medium rounded-md transition-colors min-w-0 ${
                      groupActive
                        ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
                        : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-white'
                    }`}
                    onClick={() => setOpenGroups((prev) => ({ ...prev, [group.label]: !open }))}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="ml-3 hidden group-hover:inline-flex flex-1 items-center whitespace-nowrap min-w-0">
                      <span>{group.label}</span>
                      {open ? (
                        <ChevronDown className="ml-auto h-4 w-4" />
                      ) : (
                        <ChevronRight className="ml-auto h-4 w-4" />
                      )}
                    </span>
                  </button>
                  {open && (
                    <div className="mt-1 ml-9 space-y-1 hidden group-hover:block min-w-0">
                      {group.items.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          title={item.name}
                          className={`flex items-center justify-center lg:justify-start px-2 py-1.5 text-sm rounded-md transition-colors min-w-0 ${
                            pathname.startsWith(item.href)
                              ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
                              : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-white'
                          }`}
                        >
                          <span className="hidden group-hover:inline-flex flex-1 items-center whitespace-nowrap min-w-0">
                            <span className="truncate">{item.name}</span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
          <div className="border-t border-neutral-200 dark:border-neutral-800 p-4 overflow-hidden">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 font-semibold dark:bg-neutral-700 leading-none">
                {avatarLetter}
              </div>
              <div className="hidden group-hover:block leading-tight overflow-hidden min-w-0">
                <div className="text-sm font-semibold truncate whitespace-nowrap">{displayName}</div>
                {userEmail && <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate whitespace-nowrap">{userEmail}</div>}
              </div>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="ml-auto group-hover:visible invisible">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <motion.main layout className="flex-1 overflow-x-hidden lg:ml-16 lg:transition-[margin] lg:duration-300 lg:ease-in-out lg:peer-hover:ml-64">
          <div className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur dark:bg-neutral-900/80 dark:border-neutral-800">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
              <div className="flex items-center gap-2 lg:hidden">
                <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)}>
                  <Menu className="h-5 w-5" />
                </Button>
                <Link href="/admin" className="flex items-center gap-2">
                  <Logo className="h-6 w-6" showText={false} />
                  <span className="font-semibold">Admin</span>
                </Link>
              </div>
              <div className="hidden lg:block">
                <GlobalSearch />
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex gap-3 text-xs text-neutral-600 dark:text-neutral-400">
                  <span>Open Orders: <strong className="tabular-nums">{navCounts.openOrders}</strong></span>
                  <Separator orientation="vertical" className="h-4" />
                  <span>To Fulfill: <strong className="tabular-nums">{navCounts.toFulfill}</strong></span>
                  <Separator orientation="vertical" className="h-4" />
                  <span>In Transit: <strong className="tabular-nums">{navCounts.inTransit}</strong></span>
                  <Separator orientation="vertical" className="h-4" />
                  <span>Refunds: <strong className="tabular-nums">{navCounts.refunds}</strong></span>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/">View Site</Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-7xl px-4 pt-6 sm:pt-8 pb-6 overflow-x-hidden">
            {children}
          </div>
        </motion.main>
      </div>
    </div>
  );
}
