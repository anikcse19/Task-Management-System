"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: "ADMIN" | "USER";
}

/**
 * Protects routes by checking authentication and role.
 * Redirects to login if not authenticated.
 * Redirects to appropriate dashboard if wrong role.
 */
export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    // If a specific role is required and user doesn't have it
    if (requiredRole && user.role !== requiredRole) {
      if (user.role === "ADMIN") {
        router.push("/admin/tasks");
      } else {
        router.push("/user/tasks");
      }
    }
  }, [user, isLoading, requiredRole, router]);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  // Don't render content if not authenticated or wrong role
  if (!user) return null;
  if (requiredRole && user.role !== requiredRole) return null;

  return <>{children}</>;
}
