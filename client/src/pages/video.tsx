import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CheckCircle, 
  XCircle, 
  Clock,
  Eye,
  Calendar,
  User
} from "lucide-react";
import type { VideoWithUploader } from "@shared/schema";
import { formatDistanceToNow, format } from "date-fns";

export default function VideoPage() {
  const [, params] = useRoute("/video/:id");
  const videoId = params?.id;

  const { data: video, isLoading } = useQuery<VideoWithUploader>({
    queryKey: ["/api/videos", videoId],
    enabled: !!videoId,
  });

  if (isLoading) {
    return (
      <MainLayout>
        <div className="p-6 max-w-5xl mx-auto">
          <Skeleton className="aspect-video w-full rounded-lg mb-4" />
          <Skeleton className="h-8 w-2/3 mb-2" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </MainLayout>
    );
  }

  if (!video) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="pt-6 text-center">
              <h2 className="text-xl font-bold mb-2">Video not found</h2>
              <p className="text-muted-foreground">
                This video may have been removed or doesn't exist.
              </p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  const verifiedBy = video.verificationRequests?.find((vr) => vr.status === "verified");
  const rejectedBy = video.verificationRequests?.find((vr) => vr.status === "rejected");
  const pendingVerifications = video.verificationRequests?.filter((vr) => vr.status === "pending") || [];

  const formatViews = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M views`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K views`;
    return `${count} views`;
  };

  return (
    <MainLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="aspect-video w-full rounded-lg overflow-hidden bg-black mb-4">
          <video
            src={video.videoUrl}
            controls
            className="w-full h-full"
            poster={video.thumbnailUrl || undefined}
            data-testid="video-player"
          >
            Your browser does not support video playback.
          </video>
        </div>

        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold mb-2" data-testid="video-title">
              {video.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {formatViews(video.viewCount || 0)}
              </span>
              <span className="text-muted-foreground/50">•</span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {video.createdAt
                  ? format(new Date(video.createdAt), "MMM d, yyyy")
                  : "Recently uploaded"}
              </span>
            </div>
          </div>

          {(verifiedBy || rejectedBy || pendingVerifications.length > 0) && (
            <div className="flex flex-wrap gap-2">
              {verifiedBy && (
                <Badge className="bg-success text-success-foreground gap-1 py-1">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Verified by {verifiedBy.vip.displayName}
                </Badge>
              )}
              {rejectedBy && (
                <Badge variant="destructive" className="gap-1 py-1">
                  <XCircle className="h-3.5 w-3.5" />
                  Rejected by {rejectedBy.vip.displayName}
                </Badge>
              )}
              {pendingVerifications.map((pv) => (
                <Badge key={pv.id} variant="secondary" className="gap-1 py-1">
                  <Clock className="h-3.5 w-3.5" />
                  Pending: {pv.vip.displayName}
                </Badge>
              ))}
            </div>
          )}

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage 
                    src={video.uploader.avatarUrl || undefined} 
                    alt={video.uploader.displayName || video.uploader.username} 
                  />
                  <AvatarFallback>
                    {(video.uploader.displayName || video.uploader.username)
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold">
                      {video.uploader.displayName || video.uploader.username}
                    </p>
                    {video.uploader.isAuthApproved && (
                      <Badge variant="outline" className="text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Authorized
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    @{video.uploader.username}
                  </p>
                </div>
              </div>
              
              {video.description && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm whitespace-pre-wrap">{video.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {video.verificationRequests && video.verificationRequests.length > 0 && (
            <Card>
              <CardContent className="pt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Verification Details
                </h3>
                <div className="space-y-3">
                  {video.verificationRequests.map((vr) => (
                    <div key={vr.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={vr.vip.avatarUrl || undefined} />
                          <AvatarFallback className="text-xs">
                            {(vr.vip.displayName || vr.vip.username).slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{vr.vip.displayName}</p>
                          <p className="text-xs text-muted-foreground">
                            {vr.vip.title} • {vr.vip.country}
                          </p>
                        </div>
                      </div>
                      <Badge
                        className={
                          vr.status === "verified"
                            ? "bg-success text-success-foreground"
                            : vr.status === "rejected"
                            ? "bg-destructive text-destructive-foreground"
                            : vr.status === "pending"
                            ? "bg-warning text-warning-foreground"
                            : ""
                        }
                      >
                        {vr.status === "verified" && <CheckCircle className="h-3 w-3 mr-1" />}
                        {vr.status === "rejected" && <XCircle className="h-3 w-3 mr-1" />}
                        {vr.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                        {vr.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
