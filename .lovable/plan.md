

## Plano: Simplificar BottomNav do Fornecedor (mobile)

### O que muda
A barra inferior mobile do fornecedor terá exatamente **5 ícones fixos**, sem menu "Mais" (três pontinhos):

1. **Dashboard** (Home) → `/fornecedor/dashboard`
2. **Negociações** (Handshake) → `/fornecedor/negociacoes`
3. **Chat** (MessageSquare) → `/fornecedor/chat`
4. **Estatísticas** (BarChart3) → `/fornecedor/estatisticas` *(substitui Produtos)*
5. **Editar Loja** (Store) → `/fornecedor/editar-loja` *(substitui os 3 pontinhos)*

### O que é removido
- O botão "Mais" (MoreHorizontal) e todo o Sheet/menu secundário
- Os imports não utilizados (Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, useState, MoreHorizontal, etc.)

### Desktop
Nenhuma alteração — a barra já é `md:hidden`, desktop continua usando o SupplierSidebar normalmente.

### Arquivo editado
- `src/components/fornecedor/BottomNav.tsx`

