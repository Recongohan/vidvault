import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import {
  Home,
  Upload,
  LayoutDashboard,
  Users,
  ShieldCheck,
  KeyRound,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles?: string[];
  requiresAuth?: boolean;
}

const navItems: NavItem[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "Upload", href: "/upload", icon: Upload, roles: ["creator", "admin"], requiresAuth: true },
  { label: "My Dashboard", href: "/dashboard", icon: LayoutDashboard, requiresAuth: true },
  { label: "Analytics", href: "/analytics", icon: BarChart3, roles: ["creator", "admin"], requiresAuth: true },
];

const adminItems: NavItem[] = [
  { label: "Auth Requests", href: "/admin/requests", icon: FileCheck, roles: ["admin"] },
  { label: "Manage Users", href: "/admin/users", icon: Users, roles: ["admin"] },
];

const vipItems: NavItem[] = [
  { label: "Verification Queue", href: "/vip/queue", icon: ShieldCheck, roles: ["vip"] },
  { label: "Passkey Settings", href: "/vip/passkey", icon: KeyRound, roles: ["vip"] },
];

export function Sidebar() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  const canAccess = (item: NavItem) => {
    if (!item.requiresAuth && !item.roles) return true;
    if (!user) return false;
    if (item.roles && !item.roles.includes(user.role)) return false;
    return true;
  };

  const renderNavItem = (item: NavItem) => {
    if (!canAccess(item)) return null;
    const Icon = item.icon;
    const active = isActive(item.href);

    return (
      <Link key={item.href} href={item.href}>
        <div
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer",
            "hover-elevate",
            active 
              ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
              : "text-sidebar-foreground/70 hover:text-sidebar-foreground"
          )}
          data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
        >
          <Icon className={cn("h-5 w-5 flex-shrink-0", active && "text-primary")} />
          {!collapsed && <span className="text-sm">{item.label}</span>}
        </div>
      </Link>
    );
  };

  const hasAdminAccess = user?.role === "admin";
  const hasVipAccess = user?.role === "vip";

  return (
    <aside
      className={cn(
        "sticky top-16 h-[calc(100vh-4rem)] border-r bg-sidebar flex flex-col transition-all duration-200",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map(renderNavItem)}

        {hasAdminAccess && (
          <>
            <Separator className="my-4" />
            <div className={cn("px-3 py-1", collapsed && "hidden")}>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Admin
              </span>
            </div>
            {adminItems.map(renderNavItem)}
          </>
        )}

        {hasVipAccess && (
          <>
            <Separator className="my-4" />
            <div className={cn("px-3 py-1", collapsed && "hidden")}>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                VIP Panel
              </span>
            </div>
            {vipItems.map(renderNavItem)}
          </>
        )}
      </div>

      <div className="border-t p-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center"
          onClick={() => setCollapsed(!collapsed)}
          data-testid="button-toggle-sidebar"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
    </aside>
  );
}
