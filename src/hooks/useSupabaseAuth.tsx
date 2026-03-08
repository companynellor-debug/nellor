import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';

interface Profile {
  id: string;
  nome: string;
  email: string;
  tipo: 'cliente' | 'fornecedor' | 'admin';
  document?: string;
  telefone?: string;
  pix_key?: string;
  foto_perfil_url?: string;
  banner_loja_url?: string;
  descricao_loja?: string;
  endereco_principal?: any;
  onboarding_completed: boolean;
  ativo: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  loading: boolean;
  signUp: (email: string, password: string, metadata?: {
    nome?: string;
    tipo?: 'cliente' | 'fornecedor' | 'admin';
    document?: string;
    telefone?: string;
    pix_key?: string;
    endereco_principal?: any;
  }) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any; redirectTo?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const SupabaseAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const PROFILE_SELECT = 'id, nome, email, tipo, document, telefone, pix_key, foto_perfil_url, banner_loja_url, descricao_loja, endereco_principal, onboarding_completed, ativo';

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const isTransientAuthError = (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error ?? '');
    return message.includes('Failed to fetch') || message.includes('Request timeout');
  };

  const withTimeout = async <T,>(promise: PromiseLike<T>, timeoutMs = 12000): Promise<T> => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
    });

    try {
      return await Promise.race<T>([promise, timeoutPromise]);
    } finally {
      clearTimeout(timeoutId!);
    }
  };

  const clearStaleAuthStorage = () => {
    try {
      Object.keys(localStorage)
        .filter((key) => key.startsWith('sb-') && key.endsWith('-auth-token'))
        .forEach((key) => localStorage.removeItem(key));
      sessionStorage.removeItem('nellor_admin_access');
    } catch (error) {
      console.error('Error clearing stale auth storage:', error);
    }
  };

  const sanitizeStoredSession = () => {
    try {
      const authKeys = Object.keys(localStorage).filter((key) => key.startsWith('sb-') && key.endsWith('-auth-token'));
      authKeys.forEach((key) => {
        const raw = localStorage.getItem(key);
        if (!raw) return;

        const parsed = JSON.parse(raw);
        const refreshToken = parsed?.currentSession?.refresh_token;
        const expiresAt = parsed?.currentSession?.expires_at;

        const malformedToken = typeof refreshToken !== 'string' || refreshToken.length < 20;
        const expiredSession = typeof expiresAt === 'number' && expiresAt * 1000 < Date.now() - 5 * 60 * 1000;

        if (malformedToken || expiredSession) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error sanitizing stored session:', error);
      clearStaleAuthStorage();
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('profiles')
          .select(PROFILE_SELECT)
          .eq('id', userId)
          .single(),
        10000,
      );

      if (error) throw error;
      setProfile((data as Profile) ?? null);
      return data as Profile | null;
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      setProfile(null);
      return null;
    }
  };

  useEffect(() => {
    sanitizeStoredSession();

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    // THEN check for existing session with timeout
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    withTimeout(supabase.auth.getSession(), 10000).then(({ data: { session }, error }) => {
      clearTimeout(timeout);

      if (error) {
        console.error('Error restoring auth session:', error);
        clearStaleAuthStorage();
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        void fetchProfile(session.user.id);
      }
      setLoading(false);
    }).catch((error) => {
      clearTimeout(timeout);
      console.error('Error restoring auth session:', error);
      clearStaleAuthStorage();
      setSession(null);
      setUser(null);
      setProfile(null);
      setLoading(false);
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, metadata?: {
    nome?: string;
    tipo?: 'cliente' | 'fornecedor' | 'admin';
    document?: string;
    telefone?: string;
    pix_key?: string;
    endereco_principal?: any;
  }) => {
    try {
      setLoading(true);
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await withTimeout(
        supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              nome: metadata?.nome,
              tipo: metadata?.tipo || 'cliente',
              document: metadata?.document,
              telefone: metadata?.telefone,
              pix_key: metadata?.pix_key,
              endereco_principal: metadata?.endereco_principal
            }
          }
        }),
        12000,
      );

      if (error) {
        return { error };
      }

      toast.success('Conta criada! Verifique seu email para confirmar o cadastro.');

      return { error: null };
    } catch (error: any) {
      console.error('Error signing up:', error);
      toast.error('Erro ao criar conta: ' + error.message);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);

      const executeSignIn = () => withTimeout(
        supabase.auth.signInWithPassword({
          email,
          password,
        }),
        9000,
      );

      let { data, error } = await executeSignIn();

      // Retry único para instabilidades de rede momentâneas
      if (error && isTransientAuthError(error)) {
        await sleep(900);
        const retry = await executeSignIn();
        data = retry.data;
        error = retry.error;
      }

      if (error) {
        return { error };
      }

      // Fetch profile (non-blocking hard-fail)
      if (data.user) {
        await fetchProfile(data.user.id);
      }

      toast.success('Login realizado! Bem-vindo de volta!');

      // Get redirect path based on user type
      const { data: profileData, error: profileError } = await withTimeout(
        supabase
          .from('profiles')
          .select('tipo, onboarding_completed')
          .eq('id', data.user.id)
          .single(),
        10000,
      );

      if (profileError) {
        console.error('Error fetching profile redirect data:', profileError);
      }

      let redirectTo = '/cliente';
      if (profileData?.tipo === 'fornecedor' && !profileData?.onboarding_completed) {
        redirectTo = '/fornecedor/onboarding';
      } else if (profileData?.tipo === 'fornecedor') {
        redirectTo = '/fornecedor/dashboard';
      } else if (profileData?.tipo === 'admin') {
        redirectTo = '/admin';
      }

      return { error: null, redirectTo };
    } catch (error: any) {
      console.error('Error signing in:', error);

      if (isTransientAuthError(error)) {
        clearStaleAuthStorage();
        try {
          await supabase.auth.signOut({ scope: 'local' });
        } catch {
          // no-op
        }
        setSession(null);
        setUser(null);
        setProfile(null);
      }

      let errorMessage = 'Verifique suas credenciais e tente novamente.';
      if (error.message.includes('Request timeout')) {
        errorMessage = 'O servidor demorou para responder. Tente novamente em alguns segundos.';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Falha de conexão com o servidor. Limpamos sua sessão local; tente entrar novamente.';
      } else if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Email ou senha incorretos.';
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Por favor, confirme seu email antes de fazer login.';
      }

      toast.error('Erro ao fazer login: ' + errorMessage);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setSession(null);
      setProfile(null);
      
      toast.success('Logout realizado. Até logo!');

      // Navigate using window.location to avoid router context issues
      window.location.href = '/';
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast.error('Erro ao fazer logout: ' + error.message);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      await fetchProfile(user.id);

      toast.success('Perfil atualizado com sucesso!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error('Erro ao atualizar perfil: ' + error.message);
      throw error;
    }
  };

  const completeOnboarding = async () => {
    try {
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);

      if (error) throw error;

      await fetchProfile(user.id);

      // Navigate using window.location to avoid router context issues
      window.location.href = '/fornecedor/dashboard';
    } catch (error: any) {
      console.error('Error completing onboarding:', error);
      toast.error('Erro ao completar onboarding: ' + error.message);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      isAuthenticated: !!user,
      loading,
      signUp,
      signIn,
      signOut,
      updateProfile,
      completeOnboarding
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useSupabaseAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Return a safe default instead of throwing to handle edge cases
    return {
      user: null,
      session: null,
      profile: null,
      isAuthenticated: false,
      loading: true,
      signUp: async () => ({ error: new Error('Auth not available') }),
      signIn: async () => ({ error: new Error('Auth not available') }),
      signOut: async () => {},
      updateProfile: async () => {},
      completeOnboarding: async () => {},
    } as AuthContextType;
  }
  return context;
};
