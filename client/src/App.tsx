import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home";
import LoginPage from "@/pages/login";
import SignupPage from "@/pages/signup";
import UploadPage from "@/pages/upload";
import DashboardPage from "@/pages/dashboard";
import VideoPage from "@/pages/video";
import AnalyticsPage from "@/pages/analytics";
import AdminRequestsPage from "@/pages/admin/requests";
import AdminUsersPage from "@/pages/admin/users";
import VIPQueuePage from "@/pages/vip/queue";
import VIPPasskeyPage from "@/pages/vip/passkey";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/signup" component={SignupPage} />
      <Route path="/upload" component={UploadPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/analytics" component={AnalyticsPage} />
      <Route path="/video/:id" component={VideoPage} />
      <Route path="/admin/requests" component={AdminRequestsPage} />
      <Route path="/admin/users" component={AdminUsersPage} />
      <Route path="/vip/queue" component={VIPQueuePage} />
      <Route path="/vip/passkey" component={VIPPasskeyPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
