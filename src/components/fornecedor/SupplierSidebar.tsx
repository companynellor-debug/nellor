import { Home, Package, MessageSquare, Tag, DollarSign, Bell, Settings } from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Dashboard", url: "/fornecedor/dashboard", icon: Home },
  { title: "Pedidos", url: "/fornecedor/pedidos", icon: Package },
  { title: "Chat", url: "/fornecedor/chat", icon: MessageSquare },
  { title: "Produtos", url: "/fornecedor/produtos", icon: Tag },
  { title: "Financeiro", url: "/fornecedor/financeiro", icon: DollarSign },
  { title: "Notificações", url: "/fornecedor/notificacoes", icon: Bell },
  { title: "Configurações", url: "/fornecedor/configuracoes", icon: Settings },
];

export function SupplierSidebar() {
  const { open: collapsed } = useSidebar();

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50";

  return (
    <Sidebar className={collapsed ? "w-60" : "w-14"} collapsible="icon">
      <div className="p-4 border-b">
        <h1 className={`font-heading font-bold text-primary transition-all ${collapsed ? "text-xl" : "text-sm"}`}>
          {collapsed ? "Nellor Supplier" : "NS"}
        </h1>
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="h-5 w-5" />
                      {collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
