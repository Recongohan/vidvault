import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { VideoGrid } from "@/components/video-grid";
import type { VideoWithUploader } from "@shared/schema";

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: videos = [], isLoading, isFetching } = useQuery<VideoWithUploader[]>({
    queryKey: ["/api/videos", { search: debouncedSearch }],
    queryFn: async () => {
      const url = debouncedSearch 
        ? `/api/videos?search=${encodeURIComponent(debouncedSearch)}`
        : "/api/videos";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch videos");
      return res.json();
    },
  });

  return (
    <MainLayout onSearch={setSearchQuery}>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1" data-testid="text-page-title">
            {searchQuery ? `Search: "${searchQuery}"` : "Discover Videos"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {searchQuery
              ? `${videos.length} result${videos.length !== 1 ? "s" : ""} found`
              : "Watch and verify authentic content"}
          </p>
        </div>
        <VideoGrid videos={videos} isLoading={isLoading || isFetching} />
      </div>
    </MainLayout>
  );
}
