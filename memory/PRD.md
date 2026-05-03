# Nellor - Marketplace Atacadista Digital

## Original problem statement
Importação do repo GitHub `companynellor-debug/nellor` (Lovable). Edição contínua a partir desta plataforma.

## Stack
- Vite + React 18 + TypeScript + Tailwind + shadcn/ui
- Supabase (auth, DB, storage, edge functions) — projeto `juvywnnpcbhwarhwxcgc`
- React Router v6, React Query, PWA

## Setup
- Repo em `/app/frontend`, Vite em `0.0.0.0:3000`
- Supabase CLI linkado (PAT/Service Role/DB pwd em `/app/backend/.env`)
- `vercel.json` criado com rewrites SPA → fixa erro 404 ao recarregar página na Vercel

## Implementado (sessões 1-3 — 03/05/2026)
1. **Login redesign** (`/auth`)
   - Split layout com painel esquerdo brand (gradient escuro radial) + 3D bag image
   - Textos genéricos: "Os melhores fornecedores", "Negociação direta no chat", "Cresça sua revenda"
   - Botão "Sou fornecedor" leva pra `/auth?modo=login&perfil=fornecedor`
   - Admin secret: 5 cliques no logo + senha `admin123` → entra direto (segunda senha removida)
2. **Customer dashboard com sidebar** (`#3e199e`)
   - Itens: Início, Categorias, Favoritos, Mensagens, Notificações, Meu Perfil
   - "Meus Pedidos" removida (já existe filtro no Perfil)
   - Logo sem card atrás
   - Categorias dinâmicas + CTA "Seja um vendedor"
   - Mobile preservado (BottomNav `lg:hidden`, Sidebar `hidden lg:flex`)
3. **Supplier sidebar reformulada**
   - Removida "Negociações" duplicada; "Conversas" renomeada para "Negociações"
   - "Como usar" e "Suporte" voltaram (rota `/fornecedor/suporte` criada)
4. **Admin panel redesign**
   - Sidebar agrupada em seções (VISÃO GERAL, PESSOAS, OPERAÇÕES, CATÁLOGO, SISTEMA)
   - Cor `#3e199e` + logo + badge LIVE
   - Single password (segunda tela roxa REMOVIDA)
5. **Sistema de Solicitações** (cliente publica → fornecedor envia proposta)
   - Cliente: `/cliente/minhas-solicitacoes`
   - Fornecedor: `/fornecedor/solicitacoes`
   - Nome real do fornecedor + botão "Ver loja" no card de proposta
   - Aceitar proposta abre chat **com o fornecedor específico** (via `location.state.supplierId`)
   - Migration: `get_product_favorites_counts`, policy "buyers can update on own request"
6. **Favoritos por usuário (isolado)**
   - `useFavorites` salva via `collection_items` por usuário (RLS Supabase isola)
   - Dashboard fornecedor mostra contagem real via RPC SECURITY DEFINER
7. **Relatórios fornecedor (Estatisticas) reformulado**
   - 10 KPIs (Receita, Vendas, Negociações, Conversão, Visualizações, Favoritos, Avaliação, Compradores, Produtos, Ticket)
   - Gráfico mensal (barras) + Visualizações 30 dias (linha) + Top 5 produtos
8. **Solicitação de Fornecedor** com 2 telas intro estilo Shopee
   - Step 0: "Venda para milhares de revendedores" + 4 highlights (chat, verificados, visibilidade, recebimentos)
   - Step 1: "Em 3 passos você está vendendo" + selo "100% gratuito"
   - Depois encaminha para o form atual
9. **Timers anti-fraude** alterados de 1h/24h/48h para 5 minutos em todas as transições
10. **`vercel.json`** com rewrite `/(.*) → /` (resolve 404 ao recarregar)

## Banco de dados
- 41 tabelas — `quotation_requests`, `quotation_proposals` reaproveitadas
- Migrations rodadas via `supabase db query --linked`
- RLS isolando dados por usuário (favoritos, mensagens, perfis privados)

## Backlog próximas ondas
- **Tutorial cliente/fornecedor** — refazer ComoUsar (cara de IA atual)
- **Order simulations** — calcular frete real baseado nos dados do fornecedor
- **Notificação realtime** — Supabase Realtime para fornecedor receber pop-up de nova solicitação
- **Cards de produto na Home** — refinar para match exato com foto 2
- **Profile cliente** — UX/visual mais polido (atualmente funcional mas básico)

## Test credentials
- Cliente: `cliente.teste@nellor.app` / `Teste123!`
- Fornecedor: `fornecedor.teste@nellor.app` / `Teste123!`
- Admin: 5x logo `/auth` + `admin123`

## Status
- Frontend rodando em https://github-transfer-4.preview.emergentagent.com
- TypeScript build limpo (`tsc --noEmit` passa)
- Hot reload Vite ativo
