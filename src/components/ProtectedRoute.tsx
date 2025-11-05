import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireType?: 'cliente' | 'fornecedor';
}

const ProtectedRoute = ({ children, requireType }: ProtectedRouteProps) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireType && user?.type !== requireType) {
    return <Navigate to={user?.type === 'fornecedor' ? '/fornecedor' : '/cliente'} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
