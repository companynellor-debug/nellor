# Nellor - Marketplace Atacadista Digital

## Original problem statement
"Importe o meu repositório nellor do GitHub e traga ele pra cá" — projeto Lovable, repositório `https://github.com/companynellor-debug/nellor.git`. Usuário edita a partir daqui.

## Stack
- Vite + React 18 + TypeScript + Tailwind + shadcn/ui
- Supabase (auth, DB, storage, edge functions) — projeto `juvywnnpcbhwarhwxcgc`
- React Router v6, React Query, PWA

## Setup
- Repo em `/app/frontend`, Vite em `0.0.0.0:3000`
- Supabase CLI linkado (PAT/Service Role/DB pwd em `/app/backend/.env`)

## Implementado (sessões 1-2 — 03/05/2026)
1. **Login redesign** (`/auth`) — split layout (foto 1): branding escuro à esquerda + form claro à direita; admin-secret 5x clicks no logo; signup/login unificados
2. **Customer dashboard com sidebar** (foto 2):
   - Componente `ClientSidebar` desktop-only (`hidden lg:flex`)
   - Itens: Início, Categorias, Favoritos, Mensagens (badge), Meus Pedidos, Notificações
   - Lista de CATEGORIAS dinâmica do Supabase
   - CTA "Seja um vendedor" no rodapé
   - `ClienteLayout` com `lg:pl-64` no content para shift à direita
   - Mobile preservado: `BottomNav` agora tem `lg:hidden`, sidebar `hidden lg:flex`
3. **Sistema de Solicitações** (NOVO):
   - Cliente: `/cliente/minhas-solicitacoes` — publicar solicitação, ver propostas, aceitar (abre chat)
   - Fornecedor: `/fornecedor/solicitacoes` — listar abertas, filtrar categoria, enviar proposta
   - Migrations: `get_product_favorites_counts` (RPC SECURITY DEFINER), policy "buyers can update on own request"
4. **Favoritos persistidos no Supabase** — `useFavorites` cria collection "Favoritos" automaticamente, salva em `collection_items`. Dashboard fornecedor usa RPC para contar.
5. **Textos "1h/24h" → "5 minutos"** em ComoUsar/Ajuda

## Banco de dados
- 41 tabelas — `quotation_requests`, `quotation_proposals` reaproveitadas
- Migrations rodadas via `supabase db query --linked`

## Backlog próximas ondas
- **Tutorial cliente/fornecedor** — refazer ComoUsar (cara de IA atual)
- **AdminLayout/AdminSidebar** — redesign linguagem clean
- **Fornecedor Editar Loja** — já existe rota, validar visual
- **Notificação realtime** — Supabase Realtime para fornecedor receber pop-up de nova solicitação
- Cards de produto na Home: refinar para match exato com foto 2

## Test credentials
- Cliente teste: `cliente.teste@nellor.app` / `Teste123!`
- Admin secret: 5x logo /auth → `admin123`

## Status
- Frontend rodando em https://github-transfer-4.preview.emergentagent.com
- TypeScript build limpo
- Hot reload Vite ativo
