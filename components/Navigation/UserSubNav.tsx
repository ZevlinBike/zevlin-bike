"use client";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";

export default function UserSubNav({ user }:{ user: User}) {
  const router = useRouter();
  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <div className="bg-black text-white mx-4 rounded-lg mt-1">
      <div className="container mx-auto px-4 py-1 flex justify-between items-center">
        <div>
          <span className="font-semibold">Welcome, {user.email}</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/orders" className="hover:text-gray-300">
            My Orders
          </Link>
          <button onClick={handleSignOut} className="hover:text-gray-300">
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
