import { Navigate } from 'react-router-dom';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireType?: 'cliente' | 'fornecedor' | 'admin';
}

const ProtectedRoute = ({ children, requireType }: ProtectedRouteProps) => {
  const { profile, isAuthenticated, loading } = useSupabaseAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (requireType && profile?.tipo !== requireType) {
    // Redirect to appropriate dashboard based on user type
    if (profile?.tipo === 'fornecedor') {
      return <Navigate to="/fornecedor/dashboard" replace />;
    } else if (profile?.tipo === 'admin') {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/cliente" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
