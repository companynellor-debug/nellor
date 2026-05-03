import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  name: string;
  email: string;
  type: 'cliente' | 'fornecedor';
  onboardingCompleted?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, name?: string, type?: 'cliente' | 'fornecedor') => void;
  logout: () => void;
  completeOnboarding: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('auth_user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('auth_user');
    }
  }, [user]);

  const login = (email: string, password: string, name?: string, type: 'cliente' | 'fornecedor' = 'cliente') => {
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: name || email.split('@')[0],
      email,
      type
    };
    setUser(newUser);
  };

  const logout = () => {
    setUser(null);
  };

  const completeOnboarding = () => {
    if (user) {
      setUser({ ...user, onboardingCompleted: true });
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, completeOnboarding }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
