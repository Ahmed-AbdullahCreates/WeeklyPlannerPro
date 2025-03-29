import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, isLoading, isAdmin } = useAuth();
  const [, navigate] = useLocation();
  
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        navigate("/login");
      } else if (!isAdmin) {
        navigate("/"); // Redirect non-admin users to dashboard
      }
    }
  }, [user, isLoading, isAdmin, navigate]);
  
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user || !isAdmin) {
    return null; // Will redirect in the useEffect
  }
  
  return <>{children}</>;
}
