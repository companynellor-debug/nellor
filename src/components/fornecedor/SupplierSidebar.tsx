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
  const { open } = useSidebar();

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50";

  return (
    <Sidebar collapsible="icon" className="border-r">
      <div className="p-4 border-b bg-white h-16 flex items-center justify-center">
        <h1 className={`font-heading font-bold text-primary transition-all ${open ? "text-xl" : "text-base"}`}>
          {open ? "Nellor Supplier" : "NS"}
        </h1>
      </div>

      <SidebarContent className="bg-white">
        <SidebarGroup>
          <SidebarGroupContent className="px-2 py-2">
            <SidebarMenu className="gap-2">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-12">
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className={`shrink-0 ${open ? "h-5 w-5" : "h-6 w-6"}`} />
                      {open && <span className="text-base">{item.title}</span>}
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


