import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import { Menu, Moon, Sun } from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminParticles from "@/components/admin/AdminParticles";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const AdminLayout = () => {
  const [open, setOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("admin-dark-mode");
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem("admin-dark-mode", JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-background relative">
      <AdminParticles />
      
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-950 to-violet-950 dark:from-purple-900 dark:to-violet-900 border-b border-purple-800/30 p-4 flex items-center justify-between shadow-lg">
        <h1 className="text-xl font-bold bg-gradient-to-r from-purple-200 to-violet-200 bg-clip-text text-transparent">
          NELLOR
        </h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 mr-2">
            <Sun className="h-4 w-4 text-purple-200" />
            <Switch checked={darkMode} onCheckedChange={setDarkMode} />
            <Moon className="h-4 w-4 text-purple-200" />
          </div>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-purple-800/30">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 bg-gradient-to-b from-purple-950 to-violet-950 dark:from-purple-900 dark:to-violet-900 border-purple-800/30">
              <AdminSidebar onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Desktop Header with Theme Toggle */}
      <header className="hidden lg:block fixed top-0 right-0 z-50 p-6">
        <div className="flex items-center gap-3 bg-card/80 backdrop-blur-sm px-4 py-2 rounded-full border border-border shadow-lg">
          <Sun className="h-4 w-4 text-muted-foreground" />
          <Switch checked={darkMode} onCheckedChange={setDarkMode} />
          <Moon className="h-4 w-4 text-muted-foreground" />
        </div>
      </header>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>

      {/* Main Content */}
      <div className="lg:ml-64 pt-20 lg:pt-0 p-4 sm:p-6 lg:p-8">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
