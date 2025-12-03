import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CheckCircle, 
  XCircle, 
  Clock,
  ShieldCheck,
  Loader2,
  Ban,
  Fingerprint,
  Video
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { VerificationRequestWithDetails } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { startAuthentication } from "@simplewebauthn/browser";
import { useState } from "react";

export default function VIPQueuePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { data: requests = [], isLoading } = useQuery<VerificationRequestWithDetails[]>({
    queryKey: ["/api/vip/verification-requests"],
    enabled: user?.role === "vip",
  });

  const { data: hasPasskey } = useQuery<{ hasPasskey: boolean }>({
    queryKey: ["/api/vip/has-passkey"],
    enabled: user?.role === "vip",
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ requestId, action }: { requestId: string; action: "verify" | "reject" | "ignore" }) => {
      setProcessingId(requestId);
      
      if (action !== "ignore" && hasPasskey?.hasPasskey) {
        const challengeRes = await fetch("/api/webauthn/authenticate/options", {
          method: "POST",
        });
        const options = await challengeRes.json();
        
        if (!challengeRes.ok) {
          throw new Error(options.error || "Failed to get authentication challenge");
        }
        
        const authResult = await startAuthentication({ optionsJSON: options });
        
        const verifyRes = await fetch(`/api/vip/verification-requests/${requestId}/${action}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ authResult }),
        });
        
        if (!verifyRes.ok) {
          const data = await verifyRes.json();
          throw new Error(data.error || "Verification failed");
        }
        
        return verifyRes.json();
      } else {
        return apiRequest("POST", `/api/vip/verification-requests/${requestId}/${action}`);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/vip/verification-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      const actionText = variables.action === "verify" ? "verified" : 
                         variables.action === "reject" ? "rejected" : "ignored";
      toast({ 
        title: `Video ${actionText}`, 
        description: `The video has been ${actionText} successfully.`
      });
      setProcessingId(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Action failed", 
        description: error.message || "Something went wrong. Make sure your passkey is registered.",
        variant: "destructive" 
      });
      setProcessingId(null);
    },
  });

  if (!user || user.role !== "vip") {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md w-full mx-4">
            <CardHeader className="text-center">
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>
                Only VIPs can access the verification queue.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </MainLayout>
    );
  }

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const processedRequests = requests.filter((r) => r.status !== "pending");

  return (
    <MainLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">Verification Queue</h1>
          <p className="text-muted-foreground text-sm">
            Review and verify video authenticity requests
          </p>
        </div>

        {!hasPasskey?.hasPasskey && (
          <Card className="mb-6 border-warning/50 bg-warning/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-warning">
                <Fingerprint className="h-5 w-5" />
                Passkey Required
              </CardTitle>
              <CardDescription>
                You need to register a passkey to verify or reject videos. 
                Go to Passkey Settings to set up your biometric authentication.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{pendingRequests.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">Verified</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {requests.filter((r) => r.status === "verified").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {requests.filter((r) => r.status === "rejected").length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Pending Verifications
            </CardTitle>
            <CardDescription>
              {pendingRequests.length} video{pendingRequests.length !== 1 ? "s" : ""} awaiting your verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : pendingRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShieldCheck className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No pending verification requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="p-4 rounded-lg border bg-card"
                    data-testid={`verification-request-${request.id}`}
                  >
                    <div className="flex gap-4">
                      <div className="w-40 aspect-video rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                        {request.video.thumbnailUrl ? (
                          <img 
                            src={request.video.thumbnailUrl} 
                            alt={request.video.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Video className="h-8 w-8 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold line-clamp-2 mb-1">{request.video.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={request.video.uploader.avatarUrl || undefined} />
                            <AvatarFallback className="text-[10px]">
                              {(request.video.uploader.displayName || request.video.uploader.username)
                                .slice(0, 2)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span>{request.video.uploader.displayName || request.video.uploader.username}</span>
                          <span className="text-muted-foreground/50">•</span>
                          <span>
                            {request.createdAt
                              ? formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })
                              : "recently"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => verifyMutation.mutate({ requestId: request.id, action: "verify" })}
                            disabled={verifyMutation.isPending || !hasPasskey?.hasPasskey}
                            className="bg-success hover:bg-success/90"
                            data-testid={`button-verify-${request.id}`}
                          >
                            {processingId === request.id && verifyMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                              <CheckCircle className="h-4 w-4 mr-1" />
                            )}
                            Verify
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => verifyMutation.mutate({ requestId: request.id, action: "reject" })}
                            disabled={verifyMutation.isPending || !hasPasskey?.hasPasskey}
                            data-testid={`button-reject-${request.id}`}
                          >
                            {processingId === request.id && verifyMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                              <XCircle className="h-4 w-4 mr-1" />
                            )}
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => verifyMutation.mutate({ requestId: request.id, action: "ignore" })}
                            disabled={verifyMutation.isPending}
                            data-testid={`button-ignore-${request.id}`}
                          >
                            <Ban className="h-4 w-4 mr-1" />
                            Ignore
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {processedRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>History</CardTitle>
              <CardDescription>Previously processed verification requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {processedRequests.slice(0, 10).map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-16 aspect-video rounded bg-muted flex-shrink-0 overflow-hidden">
                        {request.video.thumbnailUrl ? (
                          <img 
                            src={request.video.thumbnailUrl} 
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Video className="h-4 w-4 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate max-w-[200px]">
                          {request.video.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {request.video.uploader.displayName || request.video.uploader.username}
                        </p>
                      </div>
                    </div>
                    <Badge
                      className={
                        request.status === "verified"
                          ? "bg-success text-success-foreground"
                          : request.status === "rejected"
                          ? "bg-destructive text-destructive-foreground"
                          : ""
                      }
                    >
                      {request.status === "verified" ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : request.status === "rejected" ? (
                        <XCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <Ban className="h-3 w-3 mr-1" />
                      )}
                      {request.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
