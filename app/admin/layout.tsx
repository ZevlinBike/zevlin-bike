import { checkAdminRole } from "@/app/auth/actions";
import { redirect } from "next/navigation";
import AdminShell from "./components/AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin } = await checkAdminRole();
  if (!isAdmin) {
    redirect("/");
  }
  return <AdminShell>{children}</AdminShell>;
}

