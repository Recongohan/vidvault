import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { VideoGrid } from "@/components/video-grid";
import { 
  Video, 
  ShieldCheck, 
  Clock, 
  CheckCircle,
  XCircle,
  Loader2,
  Upload,
  Key
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import type { VideoWithUploader, AuthRequest } from "@shared/schema";

export default function DashboardPage() {
  const { user, refetch: refetchUser } = useAuth();
  const { toast } = useToast();

  const { data: myVideos = [], isLoading: videosLoading } = useQuery<VideoWithUploader[]>({
    queryKey: ["/api/my-videos"],
    enabled: !!user && user.role !== "vip",
  });

  const { data: authRequest } = useQuery<AuthRequest | null>({
    queryKey: ["/api/auth-requests/my"],
    enabled: !!user && user.role === "creator",
  });

  const requestAuthMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/auth-requests");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth-requests/my"] });
      refetchUser();
      toast({ title: "Request submitted", description: "Waiting for admin approval." });
    },
    onError: (error: any) => {
      toast({ 
        title: "Request failed", 
        description: error.message || "Something went wrong",
        variant: "destructive" 
      });
    },
  });

  if (!user) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md w-full mx-4">
            <CardHeader className="text-center">
              <CardTitle>Sign in required</CardTitle>
              <CardDescription>
                Please log in to view your dashboard.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </MainLayout>
    );
  }

  const getAuthStatus = () => {
    if (user.isAuthApproved) {
      return (
        <Badge className="bg-success text-success-foreground gap-1">
          <CheckCircle className="h-3 w-3" />
          Authorized
        </Badge>
      );
    }
    if (authRequest?.status === "pending") {
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      );
    }
    if (authRequest?.status === "rejected") {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Rejected
        </Badge>
      );
    }
    return null;
  };

  const verifiedCount = myVideos.filter(
    (v) => v.verificationRequests?.some((vr) => vr.status === "verified")
  ).length;

  const pendingCount = myVideos.filter(
    (v) => v.verificationRequests?.some((vr) => vr.status === "pending")
  ).length;

  return (
    <MainLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">Creator Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Manage your videos and verification requests
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{myVideos.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">Verified</CardTitle>
              <ShieldCheck className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{verifiedCount}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{pendingCount}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">VIP Access</CardTitle>
              <Key className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {getAuthStatus() || (
                  <span className="text-sm text-muted-foreground">Not requested</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {!user.isAuthApproved && !authRequest && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Request VIP Verification Access
              </CardTitle>
              <CardDescription>
                Get approved to request VIP verification for your videos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Once approved by an admin, you'll be able to select VIPs to verify your video content. 
                Verified videos receive a trusted badge that helps fight fake and AI-generated content.
              </p>
              <Button 
                onClick={() => requestAuthMutation.mutate()}
                disabled={requestAuthMutation.isPending}
                data-testid="button-request-auth"
              >
                {requestAuthMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Requesting...
                  </>
                ) : (
                  "Request Authorization"
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">My Videos</h2>
          <Button asChild>
            <Link href="/upload">
              <Upload className="mr-2 h-4 w-4" />
              Upload Video
            </Link>
          </Button>
        </div>

        {videosLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="aspect-video rounded-lg" />
            ))}
          </div>
        ) : (
          <VideoGrid videos={myVideos} />
        )}
      </div>
    </MainLayout>
  );
}
