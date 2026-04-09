"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  ListTodo,
  ScrollText,
  Users,
  LogOut,
} from "lucide-react";

export function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (!user) return null;

  const isAdmin = user.role === "ADMIN";

  return (
    <nav className="border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left: Logo & Navigation */}
          <div className="flex items-center gap-8">
            <Link
              href={isAdmin ? "/admin/tasks" : "/user/tasks"}
              className="text-xl font-bold text-blue-600"
            >
              TaskManager
            </Link>

            <div className="flex items-center gap-1">
              {isAdmin ? (
                <>
                  <NavLink
                    href="/admin/tasks"
                    icon={<ListTodo className="h-4 w-4" />}
                  >
                    Tasks
                  </NavLink>
                  <NavLink
                    href="/admin/users"
                    icon={<Users className="h-4 w-4" />}
                  >
                    Users
                  </NavLink>
                  <NavLink
                    href="/admin/audit"
                    icon={<ScrollText className="h-4 w-4" />}
                  >
                    Audit Logs
                  </NavLink>
                </>
              ) : (
                <NavLink
                  href="/user/tasks"
                  icon={<LayoutDashboard className="h-4 w-4" />}
                >
                  My Tasks
                </NavLink>
              )}
            </div>
          </div>

          {/* Right: User info & Logout */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">
                {user.name}
              </span>
              <Badge variant={isAdmin ? "admin" : "user"}>{user.role}</Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
    >
      {icon}
      {children}
    </Link>
  );
}
