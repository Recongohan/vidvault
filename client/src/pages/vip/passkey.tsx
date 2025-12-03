import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Fingerprint, 
  CheckCircle, 
  Loader2,
  ShieldCheck,
  Smartphone,
  Key,
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { startRegistration } from "@simplewebauthn/browser";

export default function VIPPasskeyPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isRegistering, setIsRegistering] = useState(false);

  const { data: passkeyStatus, isLoading } = useQuery<{ hasPasskey: boolean; createdAt?: string }>({
    queryKey: ["/api/vip/has-passkey"],
    enabled: user?.role === "vip",
  });

  const handleRegisterPasskey = async () => {
    setIsRegistering(true);
    
    try {
      const optionsRes = await fetch("/api/webauthn/register/options", {
        method: "POST",
      });
      
      if (!optionsRes.ok) {
        const data = await optionsRes.json();
        throw new Error(data.error || "Failed to get registration options");
      }
      
      const options = await optionsRes.json();
      
      const regResult = await startRegistration({ optionsJSON: options });
      
      const verifyRes = await fetch("/api/webauthn/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(regResult),
      });
      
      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        throw new Error(data.error || "Failed to verify registration");
      }
      
      await queryClient.invalidateQueries({ queryKey: ["/api/vip/has-passkey"] });
      toast({ 
        title: "Passkey registered!", 
        description: "You can now verify videos using biometric authentication."
      });
    } catch (error: any) {
      console.error("Passkey registration error:", error);
      toast({ 
        title: "Registration failed", 
        description: error.message || "Could not register passkey. Please try again.",
        variant: "destructive" 
      });
    } finally {
      setIsRegistering(false);
    }
  };

  if (!user || user.role !== "vip") {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md w-full mx-4">
            <CardHeader className="text-center">
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>
                Only VIPs can manage passkey settings.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">Passkey Settings</h1>
          <p className="text-muted-foreground text-sm">
            Set up biometric authentication for video verification
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Your Passkey
            </CardTitle>
            <CardDescription>
              Passkeys use your device's biometrics (fingerprint, face, etc.) to securely verify your identity
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : passkeyStatus?.hasPasskey ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-lg bg-success/10 border border-success/20">
                  <div className="h-12 w-12 rounded-full bg-success/20 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <p className="font-medium text-success">Passkey Registered</p>
                    <p className="text-sm text-muted-foreground">
                      Your biometric authentication is active
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  You can now use your fingerprint or face to verify or reject videos. 
                  Each action will require biometric confirmation for security.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 border border-dashed">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Fingerprint className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium mb-1">No passkey registered</p>
                    <p className="text-sm text-muted-foreground">
                      Register a passkey to verify videos. This uses your device's 
                      built-in biometric authentication for maximum security.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="text-center p-4">
                    <div className="h-10 w-10 rounded-full bg-muted mx-auto mb-2 flex items-center justify-center">
                      <Fingerprint className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium">Fingerprint</p>
                    <p className="text-xs text-muted-foreground">Touch ID / Fingerprint</p>
                  </div>
                  <div className="text-center p-4">
                    <div className="h-10 w-10 rounded-full bg-muted mx-auto mb-2 flex items-center justify-center">
                      <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium">Face</p>
                    <p className="text-xs text-muted-foreground">Face ID / Windows Hello</p>
                  </div>
                  <div className="text-center p-4">
                    <div className="h-10 w-10 rounded-full bg-muted mx-auto mb-2 flex items-center justify-center">
                      <Smartphone className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-xs text-muted-foreground">Mobile device passkey</p>
                  </div>
                </div>

                <Button 
                  onClick={handleRegisterPasskey}
                  disabled={isRegistering}
                  className="w-full"
                  size="lg"
                  data-testid="button-register-passkey"
                >
                  {isRegistering ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <Fingerprint className="mr-2 h-5 w-5" />
                      Register Passkey
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-primary">1</span>
              </div>
              <div>
                <p className="font-medium text-sm">Register Once</p>
                <p className="text-sm text-muted-foreground">
                  Set up your passkey using your device's biometric sensor
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-primary">2</span>
              </div>
              <div>
                <p className="font-medium text-sm">Review Videos</p>
                <p className="text-sm text-muted-foreground">
                  Creators will request verification for their uploaded videos
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-primary">3</span>
              </div>
              <div>
                <p className="font-medium text-sm">Verify with Biometrics</p>
                <p className="text-sm text-muted-foreground">
                  Approve or reject videos using your fingerprint or face for secure confirmation
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
