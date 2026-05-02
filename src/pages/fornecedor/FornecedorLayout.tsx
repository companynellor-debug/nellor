import { useEffect, useState, lazy, Suspense } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { SupplierSidebar } from "@/components/fornecedor/SupplierSidebar";
import { BottomNavFornecedor } from "@/components/fornecedor/BottomNav";
import { NotificationPermissionBanner } from "@/components/fornecedor/NotificationPermissionBanner";
import { SubscriptionBanner } from "@/components/fornecedor/SubscriptionBanner";
import { RevenueGoalBar } from "@/components/fornecedor/RevenueGoalBar";
import { MonthlyAchievements } from "@/components/fornecedor/MonthlyAchievements";
import { Bell, LogOut, Moon, Sun, Search, Plus, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useSupplierNotifications } from "@/hooks/useSupplierNotifications";
import { usePushSubscription } from "@/hooks/usePushSubscription";
import { FornecedorPrefetchProvider } from "@/hooks/useFornecedorPrefetch";
import { OnboardingTourProvider, useOnboardingTour } from "@/hooks/useOnboardingTour";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

const OnboardingTour = lazy(() => import("@/components/fornecedor/OnboardingTour"));

const FornecedorLayoutContent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, profile } = useSupabaseAuth();
  const { unreadCount } = useSupplierNotifications();
  const { subscribe, isSubscribed } = usePushSubscription();
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("fornecedor-dark-mode");
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    const autoSubscribe = async () => {
      if ('Notification' in window && Notification.permission === 'granted' && !isSubscribed) {
        const success = await subscribe();
        if (success) console.log('✅ Auto-subscribed to push notifications');
      }
    };
    const timeout = setTimeout(autoSubscribe, 2000);
    return () => clearTimeout(timeout);
  }, [subscribe, isSubscribed]);

  const { loading: authLoading } = useSupabaseAuth();
  useEffect(() => {
    if (!authLoading && profile && profile.tipo === 'fornecedor' && profile.onboarding_completed === false && location.pathname !== '/fornecedor/onboarding') {
      navigate('/fornecedor/onboarding');
    }
  }, [profile, authLoading, navigate, location.pathname]);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem("fornecedor-dark-mode", JSON.stringify(darkMode));
  }, [darkMode]);

  const handleLogout = async () => {
    await signOut();
    toast.success("Logout realizado com sucesso!");
    navigate("/");
  };

  return (
    <div className={`${darkMode ? 'dark' : ''} overflow-x-hidden`}>
      <div className="flex min-h-screen w-full max-w-full overflow-x-hidden bg-background">
        <div className="hidden md:block"><SupplierSidebar /></div>
        
        <div className="min-w-0 max-w-full flex-1 md:ml-64">
          <div className="flex min-h-screen min-w-0 max-w-full flex-col overflow-x-hidden">
            <header className="sticky top-0 z-40 flex h-16 w-full max-w-full items-center gap-3 border-b border-border bg-card px-3 shadow-sm sm:px-4 md:px-6">
              <div className="flex min-w-0 flex-1 items-center gap-3 md:hidden">
                <img src={logo} alt="Nelor" className="h-7 w-auto max-w-[108px] object-contain object-left" />
              </div>

              <div className="hidden md:flex flex-1 max-w-xl relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar produtos, pedidos ou compradores..."
                  className="pl-9 h-10 rounded-xl bg-muted/40 border-0 focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>

              <Button
                onClick={() => navigate('/fornecedor/produtos?novo=1')}
                className="hidden md:inline-flex h-10 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              >
                <Plus className="h-4 w-4 mr-1" />
                Anunciar produto
              </Button>

              <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
                <div className="hidden lg:flex items-center gap-2 mr-1">
                  <Sun className="h-4 w-4 text-muted-foreground" />
                  <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                  <Moon className="h-4 w-4 text-muted-foreground" />
                </div>
                <Button variant="ghost" size="icon" onClick={() => setDarkMode(!darkMode)} className="h-9 w-9 shrink-0 lg:hidden">
                  {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => navigate('/fornecedor/chat')} className="h-9 w-9 shrink-0">
                  <MessageSquare className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => navigate('/fornecedor/notificacoes')} className="relative h-9 w-9 shrink-0">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[10px] rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
                <button
                  onClick={() => navigate('/fornecedor/configuracoes')}
                  className="h-9 w-9 rounded-full bg-muted overflow-hidden shrink-0 flex items-center justify-center text-xs font-semibold text-muted-foreground"
                  aria-label="Perfil"
                >
                  {profile?.foto_perfil_url ? (
                    <img src={profile.foto_perfil_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    (profile?.nome?.[0] || "F").toUpperCase()
                  )}
                </button>
                <Button variant="ghost" onClick={handleLogout} size="icon" className="h-9 w-9 shrink-0" aria-label="Sair">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </header>

            <NotificationPermissionBanner />
            <RevenueGoalBar />

            <main className="flex-1 min-w-0 overflow-x-hidden p-3 pb-20 sm:p-4 md:p-6 md:pb-6">
              <div className="w-full min-w-0 max-w-full overflow-x-hidden">
                <Outlet />
              </div>
            </main>
          </div>
        </div>

        <BottomNavFornecedor />
        <Suspense fallback={null}><OnboardingTourContent /></Suspense>
      </div>
    </div>
  );
};

const OnboardingTourContent = () => {
  const { shouldShowTour, forceRestart, endTour } = useOnboardingTour();
  return <OnboardingTour onComplete={endTour} forceStart={forceRestart} />;
};

const FornecedorLayout = () => (
  <FornecedorPrefetchProvider>
    <OnboardingTourProvider>
      <FornecedorLayoutContent />
    </OnboardingTourProvider>
  </FornecedorPrefetchProvider>
);

export default FornecedorLayout;
