"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export default function RouteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "";
  // Hide site chrome on printable receipt page
  const hideChrome = /^\/order\/[^/]+\/receipt\/?$/.test(pathname);
  if (hideChrome) return null;
  return <>{children}</>;
}
