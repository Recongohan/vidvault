import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { useState, type ReactNode } from "react";

interface MainLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
  onSearch?: (query: string) => void;
}

export function MainLayout({ children, showSidebar = true, onSearch }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header onSearch={onSearch} />
      <div className="flex flex-1">
        {showSidebar && <Sidebar />}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
