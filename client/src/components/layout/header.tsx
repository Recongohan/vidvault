import { Search, Shield, LogOut, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notifications";
import { useAuth } from "@/lib/auth";
import { Link, useLocation } from "wouter";
import { useState } from "react";

interface HeaderProps {
  onSearch?: (query: string) => void;
}

export function Header({ onSearch }: HeaderProps) {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  const getRoleBadge = () => {
    if (!user) return null;
    const roleColors: Record<string, string> = {
      admin: "bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30",
      vip: "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30",
      creator: "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30",
    };
    return (
      <Badge 
        variant="outline" 
        className={`text-xs font-medium ${roleColors[user.role] || ""}`}
      >
        {user.role.toUpperCase()}
      </Badge>
    );
  };

  return (
    <header className="sticky top-0 z-50 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center justify-between gap-4 px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <Shield className="h-7 w-7 text-primary" />
          <span className="text-xl font-semibold tracking-tight hidden sm:inline-block">
            VideoVault
          </span>
        </Link>

        <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 w-full bg-muted/50 border-0 focus-visible:ring-1"
              data-testid="input-search"
            />
          </div>
        </form>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          
          {user && <NotificationBell />}
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="flex items-center gap-2 px-2"
                  data-testid="button-user-menu"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatarUrl || undefined} alt={user.displayName || user.username} />
                    <AvatarFallback className="text-xs">
                      {(user.displayName || user.username).slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline-block text-sm font-medium max-w-[100px] truncate">
                    {user.displayName || user.username}
                  </span>
                  {getRoleBadge()}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-2">
                  <p className="text-sm font-medium">{user.displayName || user.username}</p>
                  <p className="text-xs text-muted-foreground">@{user.username}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
                    <User className="h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="text-destructive cursor-pointer"
                  data-testid="button-logout"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild data-testid="link-login">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild data-testid="link-signup">
                <Link href="/signup">Sign up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
