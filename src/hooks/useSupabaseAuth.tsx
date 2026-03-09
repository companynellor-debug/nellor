import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
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
  shipping_city?: string | null;
  shipping_state?: string | null;
  store_slug?: string | null;
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

  const initInProgressRef = useRef(true);
  const getSessionResolvedRef = useRef(false);

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

  // Removed aggressive sanitizeStoredSession — Supabase SDK handles token refresh internally.
  // The old implementation was deleting valid refresh tokens on page reload, causing logout.

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
    // sanitizeStoredSession removed — Supabase handles token refresh

    const finishInit = () => {
      initInProgressRef.current = false;
      setLoading(false);
    };

    // 5s safety timeout (keeps app responsive), but DO NOT treat it as logout.
    const initTimeout = setTimeout(() => {
      if (initInProgressRef.current) finishInit();
    }, 5000);

    // Listener first
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user) {
        // fire-and-forget
        void fetchProfile(nextSession.user.id);
      } else {
        setProfile(null);
      }

      // During INITIAL_SESSION, Supabase pode disparar com session=null antes do getSession() resolver.
      // Se liberarmos loading=false cedo demais, o ProtectedRoute redireciona e “parece” logout.
      if (!initInProgressRef.current) {
        setLoading(false);
        return;
      }

      if (event !== 'INITIAL_SESSION' || getSessionResolvedRef.current || nextSession) {
        clearTimeout(initTimeout);
        finishInit();
      }
    });

    // Then restore existing session
    withTimeout(supabase.auth.getSession(), 10000)
      .then(({ data: { session }, error }) => {
        getSessionResolvedRef.current = true;
        clearTimeout(initTimeout);

        if (error) {
          console.error('Error restoring auth session:', error);
          clearStaleAuthStorage();
          setSession(null);
          setUser(null);
          setProfile(null);
          finishInit();
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) void fetchProfile(session.user.id);
        finishInit();
      })
      .catch((error) => {
        getSessionResolvedRef.current = true;
        clearTimeout(initTimeout);
        console.error('Error restoring auth session:', error);
        clearStaleAuthStorage();
        setSession(null);
        setUser(null);
        setProfile(null);
        finishInit();
      });

    return () => {
      clearTimeout(initTimeout);
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
