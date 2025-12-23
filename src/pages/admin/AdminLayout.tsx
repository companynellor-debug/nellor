import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import { Menu, Moon, Sun, Lock } from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminParticles from "@/components/admin/AdminParticles";
import AdminNotificationDropdown from "@/components/admin/AdminNotificationDropdown";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import logo from "@/assets/logo.png";

const ADMIN_PASSWORD = "nellor2024";

const AdminLayout = () => {
  const [open, setOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("admin-dark-mode");
    return saved ? JSON.parse(saved) : false;
  });
  
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("admin-authenticated") === "true";
  });
  const [clickCount, setClickCount] = useState(0);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    localStorage.setItem("admin-dark-mode", JSON.stringify(darkMode));
  }, [darkMode]);

  // Reset click count after 2 seconds of inactivity
  useEffect(() => {
    if (clickCount > 0 && clickCount < 5) {
      const timer = setTimeout(() => setClickCount(0), 2000);
      return () => clearTimeout(timer);
    }
  }, [clickCount]);

  const handleLogoClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    if (newCount >= 5) {
      setShowPasswordInput(true);
      setClickCount(0);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem("admin-authenticated", "true");
      setShowPasswordInput(false);
      setPassword("");
      setError("");
    } else {
      setError("Senha incorreta");
    }
  };

  // Show login gate if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-950 via-violet-950 to-purple-900 flex flex-col items-center justify-center p-4">
        <AdminParticles />
        
        <div className="text-center z-10">
          <img 
            src={logo} 
            alt="Nellor" 
            className="h-24 w-auto mx-auto mb-8 cursor-pointer select-none"
            onClick={handleLogoClick}
            draggable={false}
          />
          
          {!showPasswordInput ? (
            <p className="text-purple-300/60 text-sm">
              {clickCount > 0 ? `${5 - clickCount} cliques restantes...` : ""}
            </p>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                <Lock className="h-5 w-5 text-purple-300" />
                <Input
                  type="password"
                  placeholder="Senha de administrador"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-0 bg-transparent text-white placeholder:text-purple-300/50 focus-visible:ring-0"
                  autoFocus
                />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
                Entrar
              </Button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`${darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-background relative">
        <AdminParticles />
        
        {/* Mobile Header */}
        <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border p-4 flex items-center justify-between shadow-lg">
          <h1 className="text-xl font-bold text-primary">
            NELLOR
          </h1>
          <div className="flex items-center gap-2">
            <div className="text-foreground">
              <AdminNotificationDropdown />
            </div>
            <div className="flex items-center gap-2 mr-2">
              <Sun className="h-4 w-4 text-muted-foreground" />
              <Switch checked={darkMode} onCheckedChange={setDarkMode} />
              <Moon className="h-4 w-4 text-muted-foreground" />
            </div>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-foreground">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64 bg-gradient-to-b from-purple-950 to-violet-950 border-purple-800/30">
                <AdminSidebar onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>
        </header>

        {/* Desktop Header with Theme Toggle and Notifications */}
        <header className="hidden lg:block fixed top-0 right-0 z-50 p-6">
          <div className="flex items-center gap-4">
            <AdminNotificationDropdown />
            <div className="flex items-center gap-3 bg-card/80 backdrop-blur-sm px-4 py-2 rounded-full border border-border shadow-lg">
              <Sun className="h-4 w-4 text-muted-foreground" />
              <Switch checked={darkMode} onCheckedChange={setDarkMode} />
              <Moon className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </header>

        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <AdminSidebar />
        </div>

        {/* Main Content */}
        <div className="lg:ml-64 pt-20 lg:pt-8 lg:pr-32 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
export default AdminLayout;