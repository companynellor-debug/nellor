# Nellor - Marketplace Atacadista Digital

## Original problem statement
"Importe o meu repositório nellor do GitHub e traga ele pra cá" — projeto criado no Lovable, repositório `https://github.com/companynellor-debug/nellor.git`. Usuário quer editar a partir daqui.

## Stack
- Vite + React 18 + TypeScript
- Tailwind + shadcn/ui (Radix)
- Supabase (auth, DB, storage, edge functions) — projeto `juvywnnpcbhwarhwxcgc`
- React Router v6, React Query, React Hook Form, Zod
- PWA (vite-plugin-pwa, workbox)

## Setup
- Repo importado em `/app/frontend`
- Vite configurado em `0.0.0.0:3000` (supervisor compatível)
- Supabase CLI instalado e linkado ao projeto
- Credenciais salvas em `/app/backend/.env` (SUPABASE_ACCESS_TOKEN, SERVICE_ROLE_KEY, DB_PASSWORD)
- Acesso direto ao banco via `supabase db query --linked`

## Implementado (Onda 1 — 03/05/2026)
1. **Login redesign** — `/auth` agora usa o split layout idêntico à foto enviada (branding escuro à esquerda + form claro à direita; "Bem-vindo de volta!"; botão "Continuar com sua conta"; admin secret 5-clicks no logo mantido). Mobile: branding compacto + form completo.
2. **Favoritos persistidos no Supabase** — `useFavorites` agora cria collection "Favoritos" automaticamente para o usuário e salva via `collection_items`. Função SQL `get_product_favorites_counts(uuid[])` (SECURITY DEFINER) criada para o fornecedor consultar contagens via dashboard.
3. **Bug do coração no Dashboard fornecedor** — corrigido: agora chama RPC e retorna contagem real. ProdutoDetalhes prioriza UUID Supabase para favoritar.
4. **Sistema de Solicitações** — criado do zero usando tabelas existentes:
   - `/cliente/minhas-solicitacoes` — cliente publica solicitação (título, qtd, categoria, orçamento, prazo, local), vê propostas recebidas, aceita proposta abrindo chat com fornecedor.
   - `/fornecedor/solicitacoes` — fornecedor vê solicitações abertas, filtra por categoria, envia proposta (preço, dias entrega, mensagem), acompanha próprias propostas em aba.
   - Migration adicionada permitindo buyer atualizar proposals.status no próprio request.
5. **Textos "1h/24h" → "5 minutos"** em ComoUsar.tsx e Ajuda.tsx.
6. **Link no menu cliente** — "Minhas Solicitações" adicionado em `/cliente/perfil` (já visível na sidebar do fornecedor).

## Banco de dados (verificado)
- 41 tabelas, principal estrutura intacta
- Tabelas `quotation_requests`, `quotation_proposals` reaproveitadas
- Migrations rodadas via `supabase db query --linked` (não via `db push` por dessincronização do histórico remoto)

## Backlog / Próximas ondas
- **Tutorial cliente/fornecedor** — refazer ComoUsar (atualmente "cara de IA")
- **Dashboard cliente** — redesign sidebar+grid igual foto 2 (Plataforma de Negociações)
- **AdminLayout/AdminSidebar** — redesign com mesma linguagem clean
- **Fornecedor Editar Loja** — verificar se a página atual está alinhada com novo design
- Revisar e remover "Anúncios"/"Compradores" se ainda existirem em algum menu
- Real-time subscriptions nas solicitações (Supabase Realtime)
- Edge function pra notificar fornecedores quando nova solicitação for publicada na categoria deles

## Credenciais
- Acesso ao Supabase via PAT, Service Role e DB password (env: `SUPABASE_*`)
- Login admin secret: clicar 5x no logo na tela `/auth` → senha `admin123`

## Status atual
- Frontend rodando em https://github-transfer-4.preview.emergentagent.com
- Backend FastAPI (template) NÃO usado — Supabase é o backend
- Hot reload Vite funcionando
- TypeScript build limpo (`tsc --noEmit` passa)
