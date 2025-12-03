import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users,
  Shield,
  Video,
  Crown,
  CheckCircle
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import type { User } from "@shared/schema";

export default function AdminUsersPage() {
  const { user } = useAuth();

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: user?.role === "admin",
  });

  if (!user || user.role !== "admin") {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md w-full mx-4">
            <CardHeader className="text-center">
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>
                You need admin privileges to access this page.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </MainLayout>
    );
  }

  const admins = users.filter((u) => u.role === "admin");
  const vips = users.filter((u) => u.role === "vip");
  const creators = users.filter((u) => u.role === "creator");

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="h-4 w-4" />;
      case "vip":
        return <Crown className="h-4 w-4" />;
      default:
        return <Video className="h-4 w-4" />;
    }
  };

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      admin: "bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30",
      vip: "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30",
      creator: "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30",
    };
    return (
      <Badge variant="outline" className={`gap-1 ${styles[role] || ""}`}>
        {getRoleIcon(role)}
        {role.toUpperCase()}
      </Badge>
    );
  };

  const UserList = ({ users, title, icon: Icon }: { users: User[]; title: string; icon: React.ElementType }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{users.length} user{users.length !== 1 ? "s" : ""}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No users in this category</p>
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between p-3 rounded-lg border"
                data-testid={`user-${u.id}`}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={u.avatarUrl || undefined} />
                    <AvatarFallback className="text-xs">
                      {(u.displayName || u.username).slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{u.displayName || u.username}</p>
                      {u.isAuthApproved && (
                        <CheckCircle className="h-3.5 w-3.5 text-success" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      @{u.username}
                      {u.title && ` • ${u.title}`}
                      {u.country && ` • ${u.country}`}
                    </p>
                  </div>
                </div>
                {getRoleBadge(u.role)}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <MainLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">Manage Users</h1>
          <p className="text-muted-foreground text-sm">
            View and manage all users on the platform
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">VIPs</CardTitle>
              <Crown className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-500">{vips.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">Creators</CardTitle>
              <Video className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{creators.length}</div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <UserList users={vips} title="VIP Verifiers" icon={Crown} />
          <UserList users={creators} title="Content Creators" icon={Video} />
          <UserList users={admins} title="Administrators" icon={Shield} />
        </div>
      </div>
    </MainLayout>
  );
}
