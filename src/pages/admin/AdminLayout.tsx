import { Outlet } from "react-router-dom";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminParticles from "@/components/admin/AdminParticles";

const AdminLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 relative">
      <AdminParticles />
      <AdminSidebar />
      <div className="ml-64 p-8">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
