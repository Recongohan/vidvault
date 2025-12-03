import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Upload, Loader2, Video, CheckCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User } from "@shared/schema";

export default function UploadPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [selectedVips, setSelectedVips] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const { data: vips = [], isLoading: vipsLoading } = useQuery<User[]>({
    queryKey: ["/api/vips"],
    enabled: !!user?.isAuthApproved,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("video/")) {
        toast({ title: "Please select a video file", variant: "destructive" });
        return;
      }
      setVideoFile(file);
    }
  };

  const toggleVip = (vipId: string) => {
    setSelectedVips((prev) =>
      prev.includes(vipId)
        ? prev.filter((id) => id !== vipId)
        : [...prev, vipId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({ title: "Please enter a title", variant: "destructive" });
      return;
    }
    
    if (!videoFile) {
      toast({ title: "Please select a video file", variant: "destructive" });
      return;
    }
    
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("video", videoFile);
      formData.append("vipIds", JSON.stringify(selectedVips));
      
      const response = await fetch("/api/videos", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Upload failed");
      }
      
      await queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      toast({ title: "Video uploaded!", description: "Your video is now live." });
      setLocation("/");
    } catch (error: any) {
      toast({ 
        title: "Upload failed", 
        description: error.message || "Something went wrong",
        variant: "destructive" 
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (!user) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md w-full mx-4">
            <CardHeader className="text-center">
              <CardTitle>Sign in required</CardTitle>
              <CardDescription>
                You need to be logged in to upload videos.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (user.role === "vip") {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md w-full mx-4">
            <CardHeader className="text-center">
              <CardTitle>VIPs cannot upload</CardTitle>
              <CardDescription>
                As a VIP, you can only verify videos, not upload them.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">Upload Video</h1>
          <p className="text-muted-foreground text-sm">
            Share your content with the world
          </p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter video title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isUploading}
                  data-testid="input-video-title"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your video..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isUploading}
                  rows={4}
                  data-testid="input-video-description"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Video File *</Label>
                <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="video-upload"
                    disabled={isUploading}
                    data-testid="input-video-file"
                  />
                  <label htmlFor="video-upload" className="cursor-pointer">
                    {videoFile ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                          <CheckCircle className="h-6 w-6 text-success" />
                        </div>
                        <p className="font-medium">{videoFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                        <Button type="button" variant="outline" size="sm">
                          Change file
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                          <Upload className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="font-medium">Click to upload video</p>
                        <p className="text-sm text-muted-foreground">
                          MP4, WebM, or MOV up to 100MB
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
              
              {user.isAuthApproved && (
                <div className="space-y-3">
                  <Label>Request Verification (Optional)</Label>
                  <p className="text-sm text-muted-foreground">
                    Select VIPs to verify your video authenticity
                  </p>
                  {vipsLoading ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg border animate-pulse">
                          <div className="h-4 w-4 rounded bg-muted"></div>
                          <div className="h-10 w-10 rounded-full bg-muted"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 w-24 bg-muted rounded"></div>
                            <div className="h-3 w-32 bg-muted rounded"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : vips.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {vips.map((vip) => (
                        <div
                          key={vip.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedVips.includes(vip.id)
                              ? "border-primary bg-primary/5"
                              : "hover:bg-muted/50"
                          }`}
                          onClick={() => toggleVip(vip.id)}
                          data-testid={`vip-select-${vip.id}`}
                        >
                          <Checkbox
                            checked={selectedVips.includes(vip.id)}
                            onCheckedChange={() => toggleVip(vip.id)}
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
                  ) : (
                    <div className="p-4 rounded-lg bg-muted/50 border border-dashed text-center">
                      <p className="text-sm text-muted-foreground">No VIPs available for verification</p>
                    </div>
                  )}
                </div>
              )}
              
              {!user.isAuthApproved && (
                <div className="p-4 rounded-lg bg-muted/50 border border-dashed">
                  <p className="text-sm text-muted-foreground">
                    <strong>Want VIP verification?</strong> Request authorization from your dashboard to select VIPs for your uploads.
                  </p>
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isUploading}
                data-testid="button-upload-video"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Video className="mr-2 h-4 w-4" />
                    Upload Video
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </MainLayout>
  );
}
