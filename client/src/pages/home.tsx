import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { VideoGrid } from "@/components/video-grid";
import type { VideoWithUploader } from "@shared/schema";

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: videos = [], isLoading } = useQuery<VideoWithUploader[]>({
    queryKey: ["/api/videos", searchQuery],
  });

  const filteredVideos = searchQuery
    ? videos.filter(
        (v) =>
          v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.uploader.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.uploader.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : videos;

  return (
    <MainLayout onSearch={setSearchQuery}>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1" data-testid="text-page-title">
            {searchQuery ? `Search: "${searchQuery}"` : "Discover Videos"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {searchQuery
              ? `${filteredVideos.length} result${filteredVideos.length !== 1 ? "s" : ""} found`
              : "Watch and verify authentic content"}
          </p>
        </div>
        <VideoGrid videos={filteredVideos} isLoading={isLoading} />
      </div>
    </MainLayout>
  );
}
