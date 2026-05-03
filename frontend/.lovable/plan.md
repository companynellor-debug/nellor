
# Reestruturação completa: Fornecedor + Admin + Login + Negociações

Vou aplicar a estética das referências (NELOR, roxo `#4621af`, cards limpos, ícones lineares com badges) ao painel do fornecedor, admin, login, e ajustar regras de negócio (prazos e onboarding).

## 1. Sidebar e Bottom Nav do Fornecedor (estilo referência)

**`src/components/fornecedor/SupplierSidebar.tsx`** — reescrita completa:
- Fundo branco (light) / `bg-card` (dark), texto `text-foreground`, **não mais gradiente roxo**.
- Logo NELOR + subtítulo "PLATAFORMA DE NEGOCIAÇÕES".
- Itens (apenas os que existem na plataforma — sem "Anúncios", sem "Compradores" como seção fake):
  - Painel, Produtos, Pedidos (badge), Conversas (badge), Negociações, Financeiro, Avaliações, Relatórios, Configurações.
- Item ativo: pílula roxa `#4621af` com texto branco e ícone branco (não DarkGlassIcon).
- Card "Dica de hoje" no rodapé com botão "Ver dicas" → abre o tour novamente.
- Footer: avatar + nome + "Vendedor" puxados de `profile`.

**`src/components/fornecedor/BottomNav.tsx`** — 5 itens conforme mockup mobile:
Painel, Produtos, **Anunciar (botão central roxo flutuante → abre ProductModal)**, Conversas (badge), Perfil (→ `/fornecedor/configuracoes`). Glassmorphism, safe-area inset.

## 2. Header desktop do Fornecedor

**`src/pages/fornecedor/FornecedorLayout.tsx`**:
- Adicionar header com: barra de busca global (produtos/pedidos/compradores), botão "+ Anunciar produto" roxo, ícone de mensagens, ícone de sino com badge, avatar do usuário.
- Remover qualquer barra antiga conflitante.

## 3. Configurações do Fornecedor — dados reais

**`src/pages/fornecedor/Configuracoes.tsx`**:
- Remover valores hard-coded (`'Minha Loja Premium'`, `'11999999999'`, etc).
- Carregar do `profiles` do usuário logado: `nome` (loja), `telefone`, `endereco_principal`, `email`.
- Usar `useStoreProfile` ou query direta no `profiles` por `auth.uid()`.
- `handleSave` faz `update` real no `profiles` (não só toast).
- Manter abas: Informações da loja, Métodos de pagamento, Formas de envio, Segurança (alterar senha via `supabase.auth.updateUser`), Excluir conta.

## 4. Onboarding cliente — apenas no signup

**`src/hooks/useClientOnboardingTour.tsx`** (e `ClienteLayout.tsx`):
- Não disparar baseado apenas em `client_onboarding_completed = false` para todos os usuários antigos.
- Disparar somente quando `profiles.created_at` for recente (< 5 min) **OU** quando há flag `nellor_just_signed_up` em `sessionStorage` (setada no `Login.tsx` no caminho de signup).
- Após concluir/pular, sempre `update profiles set client_onboarding_completed = true`.
- Manter o botão flutuante de ajuda para reabrir manualmente.

## 5. Tela de Login (estilo referência foto 5)

**`src/pages/Login.tsx`** — split-screen desktop, single-column mobile:
- **Esquerda (desktop)**: fundo `#1a1340` / roxo escuro, logo NELOR grande, título "Seu marketplace de negociações", 3 features com ícones (2.000+ usuários, Negociação direta no chat, R$5M+ movimentados), ilustração 3D no rodapé.
- **Direita / mobile**: card branco com "Bem-vindo de volta!", inputs e-mail/senha com ícones, link "Esqueci minha senha", botão "Entrar" roxo `#4621af`, separador "ou continue com sua conta", botão secundário "Continuar com sua conta", link "Criar conta".
- Manter: 5 cliques na logo abre dialog admin, lógica de signup só para `cliente`, set `nellor_just_signed_up` no signup.

## 6. Painel Admin — visual moderno

**`src/pages/admin/AdminLayout.tsx`** + **`src/components/admin/AdminSidebar.tsx`**:
- Sidebar branca/card (mesma linguagem do fornecedor) em vez de gradiente roxo intenso.
- Itens: Dashboard, Usuários, Fornecedores, Solicitações, Assinaturas, Produtos (via Categorias/Banners), Negociações, Disputas, Suporte, Relatórios, Configurações.
- Header desktop com busca + notificações + toggle dark + avatar admin.
- Mantém gate de senha (5 cliques + senha) intacto.

## 7. Bug: aprovar assinatura

**Investigação**: o RPC `admin_confirm_subscription` existe (migrações `20260406193708` e `20260407190942`). Como há duas versões, `CREATE OR REPLACE` da segunda é o que está ativo. Provavelmente o erro vem de:
- `subscriptions.status` aceitando apenas valores específicos (CHECK constraint), ou
- falta de `SECURITY DEFINER` / search_path, ou
- assinatura criada sem `started_at`/`expires_at` permitidos.

**Plano**:
1. Ler a versão atual do RPC + tabela `subscriptions` via `supabase--read_query` ao entrar no modo build.
2. Reproduzir clicando "Confirmar Pagamento" no preview e capturar erro do console.
3. Criar nova migration corrigindo o RPC (garantindo `SECURITY DEFINER`, `set search_path = public`, validação de admin via `has_role`, set `status='active'`, `started_at = now()`, `expires_at = now() + interval '30 days'`, gravar `confirmed_by`/`notes`).
4. Notificar o fornecedor por `notifications` insert na mesma transação.

## 8. Prazos de negociação → 5 minutos

Substituir todos os limites de tempo (1h aceitar, 24h enviar, 48h entregar) por **5 minutos**:

- **`supabase/functions/check-delivery-dates/index.ts`**: trocar comparação por `expected_delivery <= now() - interval '5 minutes'` (campo passa a ser timestamp lógico de 5 min após criação/aceite).
- **Migration nova**: atualizar triggers `validate_negotiation_transition` e quaisquer RPCs/cron jobs que usem `1 hour`, `24 hours`, `48 hours` → `5 minutes`. Buscar nas migrações por essas constantes e regenerar funções afetadas.
- **`src/components/chat/NegotiationForm.tsx`** e telas de negociação: trocar textos "1h para aceitar / 24h para enviar / 48h para entregar" por "5 minutos".
- Revisar `useNegotiations` / componentes que mostram countdown.

## 9. Limpezas

- Remover do código rotas/componentes "Anúncios", "Compradores" (lista de clientes fake), "Drop", "Wallets" se ainda houver referências.
- Garantir que apenas abas/itens com função real apareçam em sidebars e bottom navs.

---

## Detalhes técnicos

**Cores e tokens** (atualizar `src/index.css` se necessário):
- `--primary: 252 73% 48%` (~ `#4621af`).
- Sidebars: `bg-card border-r border-border`, item ativo `bg-primary text-primary-foreground rounded-xl`.

**Onboarding gating SQL**: usar `created_at > now() - interval '5 minutes'` na lógica do hook (client-side com `Date.parse`).

**Dados reais Configurações**: `supabase.from('profiles').select('nome, telefone, email, endereco_principal, foto_perfil_url').eq('id', user.id).single()`.

**Migrations a criar**:
1. Fix `admin_confirm_subscription` RPC (após inspecionar erro real).
2. Update triggers/funções de prazos para 5 min.

**Arquivos editados (resumo)**:
- `SupplierSidebar.tsx`, `BottomNav.tsx` (fornecedor), `FornecedorLayout.tsx`, `Configuracoes.tsx`
- `AdminLayout.tsx`, `AdminSidebar.tsx`
- `Login.tsx`
- `useClientOnboardingTour.tsx`, `ClienteLayout.tsx`
- `NegotiationForm.tsx`, `check-delivery-dates/index.ts`
- 2 novas migrations SQL

Posso prosseguir?
