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
  Megaphone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { motion, AnimatePresence } from "framer-motion";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Products", href: "/admin/products", icon: Package },
  { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { name: "Customers", href: "/admin/customers", icon: Users },
  { name: "Blog", href: "/admin/blog", icon: Newspaper },
  { name: "Announcements", href: "/admin/announcements", icon: Megaphone },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

function AdminShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

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
                    </Link>
                  );
                })}
              </nav>
              <div className="border-t border-neutral-200 dark:border-neutral-700 p-4">
                <Button variant="ghost" className="w-full justify-start text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white">
                  <LogOut className="mr-3 h-5 w-5" />
                  Sign Out
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white dark:bg-neutral-800 border-r border-neutral-200 dark:border-neutral-700">
          <div className="flex h-16 items-center px-4">
            <h1 className="text-xl font-bold text-neutral-900 dark:text-white">Admin</h1>
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
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-neutral-200 dark:border-neutral-700 p-4">
            <Button variant="ghost" className="w-full justify-start text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white">
              <LogOut className="mr-3 h-5 w-5" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
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
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <div className="text-sm text-neutral-600 dark:text-neutral-300">
                Admin User
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
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
      <div className="flex h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="ml-4">Verifying admin access...</p>
      </div>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}
