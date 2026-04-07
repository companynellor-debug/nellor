import { useEffect, useState, lazy, Suspense } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { SupplierSidebar } from "@/components/fornecedor/SupplierSidebar";
import { BottomNavFornecedor } from "@/components/fornecedor/BottomNav";
import { NotificationPermissionBanner } from "@/components/fornecedor/NotificationPermissionBanner";
import { SubscriptionBanner } from "@/components/fornecedor/SubscriptionBanner";
import { Bell, LogOut, Moon, Sun } from "lucide-react";
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
            <header className="sticky top-0 z-40 flex h-14 w-full max-w-full items-center gap-2 overflow-hidden border-b border-border bg-card px-3 shadow-sm sm:px-4 md:px-6">
              <div className="flex min-w-0 flex-1 items-center md:hidden">
                <img src={logo} alt="Nellor" className="h-7 w-auto max-w-[108px] object-contain object-left sm:h-8 sm:max-w-[140px]" />
              </div>
              <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
                <div className="hidden sm:flex items-center gap-2 mr-2">
                  <Sun className="h-4 w-4 text-muted-foreground" />
                  <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                  <Moon className="h-4 w-4 text-muted-foreground" />
                </div>
                <Button variant="ghost" size="icon" onClick={() => setDarkMode(!darkMode)} className="h-8 w-8 shrink-0 sm:hidden">
                  {darkMode ? <Sun className="h-4 w-4 text-foreground" /> : <Moon className="h-4 w-4 text-foreground" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => navigate('/fornecedor/notificacoes')} className="relative h-8 w-8 shrink-0 sm:h-9 sm:w-9">
                  <Bell className="h-4 w-4 text-foreground" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
                <Button variant="ghost" onClick={handleLogout} size="icon" className="h-8 w-8 shrink-0 sm:h-9 sm:w-auto sm:px-3">
                  <LogOut className="h-4 w-4 text-foreground" />
                  <span className="hidden sm:inline ml-2 text-foreground">Sair</span>
                </Button>
              </div>
            </header>

            <NotificationPermissionBanner />
            <SubscriptionBanner />

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
