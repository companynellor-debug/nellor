import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireType?: 'cliente' | 'fornecedor' | 'admin';
}

const ProtectedRoute = ({ children, requireType }: ProtectedRouteProps) => {
  const { user, profile, isAuthenticated, loading } = useSupabaseAuth();
  const [roleLoading, setRoleLoading] = useState(false);
  const [hasAdminRole, setHasAdminRole] = useState(false);

  useEffect(() => {
    if (requireType !== 'admin') {
      setHasAdminRole(false);
      setRoleLoading(false);
      return;
    }

    // Check sessionStorage for admin access (set via password login)
    const adminAccess = sessionStorage.getItem('nellor_admin_access');
    if (adminAccess === 'true') {
      setHasAdminRole(true);
      setRoleLoading(false);
      return;
    }

    // Also check database role if user is authenticated
    if (!user?.id) {
      setHasAdminRole(false);
      setRoleLoading(false);
      return;
    }

    const checkAdminRole = async () => {
      setRoleLoading(true);
      try {
        const { data, error } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin',
        });

        if (error) {
          console.error('Error checking admin role:', error);
          setHasAdminRole(false);
          return;
        }

        setHasAdminRole(Boolean(data));
      } finally {
        setRoleLoading(false);
      }
    };

    void checkAdminRole();
  }, [requireType, user?.id]);

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (requireType === 'admin') {
    if (!hasAdminRole) return <Navigate to="/auth" replace />;
    return <>{children}</>;
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
