import { Outlet } from "react-router-dom";
import { useState } from "react";
import { Menu } from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminParticles from "@/components/admin/AdminParticles";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const AdminLayout = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 relative">
      <AdminParticles />
      
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-950 to-violet-950 border-b border-purple-800/30 p-4 flex items-center justify-between shadow-lg">
        <h1 className="text-xl font-bold bg-gradient-to-r from-purple-200 to-violet-200 bg-clip-text text-transparent">
          NELLOR
        </h1>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-purple-800/30">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 bg-gradient-to-b from-purple-950 to-violet-950 border-purple-800/30">
            <AdminSidebar onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </header>

      {/* Desktop Sidebar - Always visible */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="pt-20 lg:pt-0 p-4 sm:p-6 lg:ml-64 lg:p-8">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
