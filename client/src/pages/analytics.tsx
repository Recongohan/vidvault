import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Video, CheckCircle, Clock, XCircle, TrendingUp } from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import type { VideoWithUploader } from "@shared/schema";

interface CreatorStats {
  totalVideos: number;
  totalViews: number;
  verifiedCount: number;
  pendingCount: number;
  rejectedCount: number;
}

export default function AnalyticsPage() {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery<CreatorStats>({
    queryKey: ["/api/my-stats"],
    enabled: !!user,
  });

  const { data: videos = [], isLoading: videosLoading } = useQuery<VideoWithUploader[]>({
    queryKey: ["/api/my-videos"],
    enabled: !!user,
  });

  const isLoading = statsLoading || videosLoading;

  const verificationData = [
    { name: "Verified", value: stats?.verifiedCount || 0, color: "hsl(var(--chart-2))" },
    { name: "Pending", value: stats?.pendingCount || 0, color: "hsl(var(--chart-4))" },
    { name: "Rejected", value: stats?.rejectedCount || 0, color: "hsl(var(--chart-1))" },
  ].filter(d => d.value > 0);

  const topVideos = [...videos]
    .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
    .slice(0, 5)
    .map(v => ({
      name: v.title.length > 20 ? v.title.substring(0, 20) + "..." : v.title,
      views: v.viewCount || 0,
    }));

  if (!user) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md w-full mx-4">
            <CardHeader className="text-center">
              <CardTitle>Sign In Required</CardTitle>
              <CardDescription>
                Please sign in to view your analytics.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1" data-testid="text-page-title">Analytics Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Track your video performance and verification status
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card data-testid="card-total-videos">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats?.totalVideos || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-total-views">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats?.totalViews?.toLocaleString() || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-verified-count">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">Verified</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-green-600">{stats?.verifiedCount || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-pending-count">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-amber-600">{stats?.pendingCount || 0}</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card data-testid="card-top-videos-chart">
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Top Performing Videos</CardTitle>
              </div>
              <CardDescription>Videos ranked by view count</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : topVideos.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={topVideos} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="views" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  No videos uploaded yet
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-verification-chart">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Verification Status</CardTitle>
              </div>
              <CardDescription>Distribution of video verification states</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : verificationData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={verificationData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {verificationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  No verification data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {stats?.rejectedCount ? (
          <Card className="mt-6" data-testid="card-rejected-alert">
            <CardHeader className="flex flex-row items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              <div>
                <CardTitle className="text-base">Rejected Videos</CardTitle>
                <CardDescription>
                  {stats.rejectedCount} video{stats.rejectedCount !== 1 ? "s" : ""} have been rejected by VIPs
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        ) : null}
      </div>
    </MainLayout>
  );
}
