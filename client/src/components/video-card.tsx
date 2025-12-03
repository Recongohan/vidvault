import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Eye } from "lucide-react";
import type { VideoWithUploader, VerificationStatus } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface VideoCardProps {
  video: VideoWithUploader;
}

export function VideoCard({ video }: VideoCardProps) {
  const verifiedBy = video.verificationRequests?.find(
    (vr) => vr.status === "verified"
  );
  const rejectedBy = video.verificationRequests?.find(
    (vr) => vr.status === "rejected"
  );

  const getVerificationBadge = () => {
    if (verifiedBy) {
      return (
        <Badge className="bg-success text-success-foreground gap-1 flex-shrink-0">
          <CheckCircle className="h-3 w-3" />
          Verified
        </Badge>
      );
    }
    if (rejectedBy) {
      return (
        <Badge variant="destructive" className="gap-1 flex-shrink-0">
          <XCircle className="h-3 w-3" />
          Suspicious
        </Badge>
      );
    }
    const hasPending = video.verificationRequests?.some(
      (vr) => vr.status === "pending"
    );
    if (hasPending) {
      return (
        <Badge variant="secondary" className="gap-1 flex-shrink-0">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      );
    }
    return null;
  };

  const formatViews = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <Link href={`/video/${video.id}`}>
      <Card 
        className="overflow-hidden hover-elevate cursor-pointer group"
        data-testid={`video-card-${video.id}`}
      >
        <div className="relative aspect-video bg-muted overflow-hidden">
          {video.thumbnailUrl ? (
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
              <span className="text-4xl text-muted-foreground/30 font-bold">
                {video.title.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <div className="p-3">
          <div className="flex gap-3">
            <Avatar className="h-9 w-9 flex-shrink-0">
              <AvatarImage 
                src={video.uploader.avatarUrl || undefined} 
                alt={video.uploader.displayName || video.uploader.username} 
              />
              <AvatarFallback className="text-xs">
                {(video.uploader.displayName || video.uploader.username)
                  .slice(0, 2)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2 mb-1">
                <h3 
                  className="font-semibold text-sm line-clamp-2 leading-tight flex-1"
                  data-testid={`video-title-${video.id}`}
                >
                  {video.title}
                </h3>
                {getVerificationBadge()}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {video.uploader.displayName || video.uploader.username}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {formatViews(video.viewCount || 0)} views
                </span>
                <span className="text-muted-foreground/50">•</span>
                <span>
                  {video.createdAt
                    ? formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })
                    : "Just now"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
