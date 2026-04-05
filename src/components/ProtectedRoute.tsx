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

  // Admin access via sessionStorage kept for backward compatibility but also validates via DB
  const adminAccess = requireType === 'admin' ? sessionStorage.getItem('nellor_admin_access') === 'true' : false;

  useEffect(() => {
    const checkAccess = async () => {
      if (requireType !== 'admin') {
        setHasAdminRole(false);
        setRoleLoading(false);
        return;
      }

      setRoleLoading(true);

      if (adminAccess) {
        setHasAdminRole(true);
        setRoleLoading(false);
        return;
      }

      if (!user?.id) {
        setHasAdminRole(false);
        setRoleLoading(false);
        return;
      }

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

    void checkAccess();
  }, [requireType, user?.id, adminAccess]);

  // Show loader while auth is loading
  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Admin via sessionStorage - bypass everything
  if (requireType === 'admin' && adminAccess) {
    return <>{children}</>;
  }

  // Admin check via DB role
  if (requireType === 'admin') {
    if (!hasAdminRole) {
      return <Navigate to="/auth" replace />;
    }
    return <>{children}</>;
  }

  // For non-admin routes, require authentication
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // CRITICAL FIX: If authenticated but profile not yet loaded, wait
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (requireType && profile.tipo !== requireType) {
    if (profile.tipo === 'fornecedor') {
      return <Navigate to="/fornecedor/dashboard" replace />;
    } else if (profile.tipo === 'admin') {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/cliente" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
