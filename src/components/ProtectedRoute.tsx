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
    const checkAccess = async () => {
      if (requireType !== 'admin') {
        setHasAdminRole(false);
        setRoleLoading(false);
        return;
      }

      setRoleLoading(true);
      
      // Check sessionStorage for admin access (set via password login)
      const adminAccess = sessionStorage.getItem('nellor_admin_access');
      console.log('Checking admin access:', adminAccess);
      
      if (adminAccess === 'true') {
        console.log('Admin access granted via sessionStorage');
        setHasAdminRole(true);
        setRoleLoading(false);
        return;
      }

      // Also check database role if user is authenticated
      if (!user?.id) {
        console.log('No user and no sessionStorage admin access');
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

        console.log('Has admin role from DB:', Boolean(data));
        setHasAdminRole(Boolean(data));
      } finally {
        setRoleLoading(false);
      }
    };

    void checkAccess();
  }, [requireType, user?.id]);

  console.log('ProtectedRoute check:', { requireType, isAuthenticated, hasAdminRole, roleLoading, loading });

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // SPECIAL CASE: Admin via sessionStorage (password access) - allow without authentication
  if (requireType === 'admin') {
    if (!hasAdminRole) {
      console.log('Admin required but not granted, redirecting to /auth');
      return <Navigate to="/auth" replace />;
    }
    console.log('Admin access granted, rendering children');
    return <>{children}</>;
  }

  // For non-admin routes, require authentication
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
