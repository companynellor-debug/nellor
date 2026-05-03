import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import { Menu, Moon, Sun } from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminParticles from "@/components/admin/AdminParticles";
import AdminNotificationDropdown from "@/components/admin/AdminNotificationDropdown";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

const AdminLayoutContent = () => {
  const [open, setOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("admin-dark-mode");
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem("admin-dark-mode", JSON.stringify(darkMode));
  }, [darkMode]);

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
              <SheetContent side="left" className="p-0 w-64 border-0" style={{ backgroundColor: "#3e199e" }}>
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

// Layout direto sem prefetch agressivo - cada página carrega seus dados
const AdminLayout = () => {
  return <AdminLayoutContent />;
};

export default AdminLayout;