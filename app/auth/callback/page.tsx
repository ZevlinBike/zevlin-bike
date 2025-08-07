"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleAuthCallback = async () => {
      const supabase = createClient();

      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }

        if (data.session) {
          // User is authenticated, redirect to home page
          router.push("/");
          router.refresh();
        } else {
          // No session found, redirect to login
          router.push("/auth/login");
        }
      } catch (error) {
        console.error("Auth callback error:", error);
        setError(error instanceof Error ? error.message : "Authentication failed");
        setTimeout(() => {
          router.push("/auth/login");
        }, 3000);
      } finally {
        setIsLoading(false);
      }
    };

    handleAuthCallback();
  }, [router]);

  if (isLoading) {
    return (
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing authentication...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <p className="text-gray-600">Redirecting to login page...</p>
      </div>
    );
  }

  return null;
} 