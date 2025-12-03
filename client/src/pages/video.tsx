import { useState } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle, 
  XCircle, 
  Clock,
  Eye,
  Calendar,
  User,
  History,
  Send,
  Shield,
  Upload,
  Ban,
  ShieldPlus,
  Loader2
} from "lucide-react";
import type { VideoWithUploader, VerificationRequest, User as UserType } from "@shared/schema";
import { formatDistanceToNow, format } from "date-fns";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function VideoPage() {
  const [, params] = useRoute("/video/:id");
  const videoId = params?.id;
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedVips, setSelectedVips] = useState<string[]>([]);

  const { data: video, isLoading } = useQuery<VideoWithUploader>({
    queryKey: ["/api/videos", videoId],
    enabled: !!videoId,
  });

  const isOwner = user && video && video.uploaderId === user.id;
  const canRequestVerification = !!(isOwner && user?.isAuthApproved);

  const { data: vips = [], isLoading: vipsLoading } = useQuery<UserType[]>({
    queryKey: ["/api/vips"],
    enabled: canRequestVerification,
  });

  const requestedVipIds = video?.verificationRequests?.map(vr => vr.vipId) || [];
  const availableVips = (vips as UserType[]).filter((vip: UserType) => !requestedVipIds.includes(vip.id));

  const toggleVip = (vipId: string) => {
    setSelectedVips(prev =>
      prev.includes(vipId)
        ? prev.filter(id => id !== vipId)
        : [...prev, vipId]
    );
  };

  const requestVerificationMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/videos/${videoId}/verification-requests`, { vipIds: selectedVips });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos", videoId] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-videos"] });
      setSelectedVips([]);
      toast({ 
        title: "Verification requested", 
        description: `Request sent to ${selectedVips.length} VIP${selectedVips.length > 1 ? "s" : ""}` 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Request failed", 
        description: error.message || "Something went wrong",
        variant: "destructive" 
      });
    },
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

  type TimelineEvent = {
    id: string;
    type: "upload" | "request" | "verified" | "rejected" | "ignored" | "pending";
    title: string;
    description: string;
    timestamp: Date | null;
    user?: UserType;
    icon: React.ElementType;
    iconClass: string;
  };

  const buildTimeline = (): TimelineEvent[] => {
    if (!video) return [];
    
    const events: TimelineEvent[] = [];
    
    if (video.createdAt) {
      events.push({
        id: "upload",
        type: "upload",
        title: "Video Uploaded",
        description: `${video.uploader.displayName || video.uploader.username} uploaded this video`,
        timestamp: new Date(video.createdAt),
        user: video.uploader,
        icon: Upload,
        iconClass: "text-blue-500 bg-blue-500/10",
      });
    }

    if (video.verificationRequests) {
      video.verificationRequests.forEach((vr) => {
        events.push({
          id: `request-${vr.id}`,
          type: "request",
          title: "Verification Requested",
          description: `Sent to ${vr.vip.displayName || vr.vip.username} for verification`,
          timestamp: vr.createdAt ? new Date(vr.createdAt) : null,
          user: vr.vip,
          icon: Send,
          iconClass: "text-muted-foreground bg-muted",
        });

        if (vr.status === "verified" && vr.processedAt) {
          events.push({
            id: `verified-${vr.id}`,
            type: "verified",
            title: "Video Verified",
            description: `${vr.vip.displayName || vr.vip.username} verified this video with passkey`,
            timestamp: new Date(vr.processedAt),
            user: vr.vip,
            icon: Shield,
            iconClass: "text-success bg-success/10",
          });
        } else if (vr.status === "rejected" && vr.processedAt) {
          events.push({
            id: `rejected-${vr.id}`,
            type: "rejected",
            title: "Video Rejected",
            description: `${vr.vip.displayName || vr.vip.username} rejected this video`,
            timestamp: new Date(vr.processedAt),
            user: vr.vip,
            icon: Ban,
            iconClass: "text-destructive bg-destructive/10",
          });
        } else if (vr.status === "ignored" && vr.processedAt) {
          events.push({
            id: `ignored-${vr.id}`,
            type: "ignored",
            title: "Request Ignored",
            description: `${vr.vip.displayName || vr.vip.username} ignored the verification request`,
            timestamp: new Date(vr.processedAt),
            user: vr.vip,
            icon: XCircle,
            iconClass: "text-muted-foreground bg-muted",
          });
        }
      });
    }

    return events.sort((a, b) => {
      if (!a.timestamp) return 1;
      if (!b.timestamp) return -1;
      return a.timestamp.getTime() - b.timestamp.getTime();
    });
  };

  const timeline = buildTimeline();

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
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  VIP Verification Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {video.verificationRequests.map((vr) => (
                    <div key={vr.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50" data-testid={`verification-status-${vr.id}`}>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
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
                      <div className="text-right">
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
                        {vr.processedAt && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(vr.processedAt), { addSuffix: true })}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {canRequestVerification && availableVips.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShieldPlus className="h-5 w-5" />
                  Request VIP Verification
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Select VIPs to verify your video authenticity
                </p>
                <div className="grid gap-3 sm:grid-cols-2 mb-4">
                  {availableVips.map((vip) => (
                    <div
                      key={vip.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedVips.includes(vip.id)
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => toggleVip(vip.id)}
                      data-testid={`vip-request-${vip.id}`}
                    >
                      <Checkbox
                        checked={selectedVips.includes(vip.id)}
                        onCheckedChange={(e) => e.stopPropagation()}
                      />
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={vip.avatarUrl || undefined} />
                        <AvatarFallback>
                          {(vip.displayName || vip.username).slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {vip.displayName || vip.username}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {vip.title} • {vip.country}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={() => requestVerificationMutation.mutate()}
                  disabled={selectedVips.length === 0 || requestVerificationMutation.isPending}
                  data-testid="button-request-verification"
                >
                  {requestVerificationMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Requesting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Request Verification ({selectedVips.length})
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {timeline.length > 1 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Verification Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />
                  <div className="space-y-6">
                    {timeline.map((event, index) => (
                      <div 
                        key={event.id} 
                        className="relative flex gap-4 items-start"
                        data-testid={`timeline-event-${event.id}`}
                      >
                        <div className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full ${event.iconClass}`}>
                          <event.icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 pt-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm">{event.title}</p>
                            {event.timestamp && (
                              <span className="text-xs text-muted-foreground">
                                {format(event.timestamp, "MMM d, yyyy 'at' h:mm a")}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {event.description}
                          </p>
                          {event.user && (
                            <div className="flex items-center gap-2 mt-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={event.user.avatarUrl || undefined} />
                                <AvatarFallback className="text-xs">
                                  {(event.user.displayName || event.user.username).slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-muted-foreground">
                                {event.user.displayName || event.user.username}
                                {event.user.title && ` • ${event.user.title}`}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
