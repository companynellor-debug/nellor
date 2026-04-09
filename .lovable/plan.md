

## Redesign Completo do Chat + Sistema de Status (Stories)

O chat atual tem vários problemas: status "online" falso, nomes genéricos "Cliente" no painel do fornecedor, sem busca de fornecedores, e visual básico. Vamos reconstruir inspirado na referência (imagem 2) adaptado às cores e contexto da Nellor, além de adicionar um sistema de Status tipo WhatsApp.

---

### Parte 1: Banco de Dados (Migration)

**Nova tabela `supplier_stories`:**
- `id`, `supplier_id` (ref profiles), `media_url` (texto/imagem), `caption` (texto opcional), `type` (text | image | video), `created_at`, `expires_at` (created_at + 24h)
- RLS: fornecedores inserem/deletam os seus; todos autenticados podem ler

**Nova tabela `story_views`:**
- `id`, `story_id` (ref supplier_stories), `viewer_id` (ref profiles), `viewed_at`
- RLS: viewers inserem as suas; fornecedores leem views dos seus stories

**Novo campo `last_seen_at` na tabela `profiles`:**
- Timestamp nullable, atualizado via trigger ou chamada direta quando o usuário interage

**Novo campo `pinned_suppliers` (jsonb array) na tabela `profiles`:**
- Array de IDs de fornecedores fixados pelo cliente no chat

---

### Parte 2: Sistema de Presença Real (Online/Offline)

**Hook `usePresence.tsx`:**
- Usa Supabase Realtime Presence para rastrear quem está realmente online
- Atualiza `last_seen_at` no perfil a cada 60 segundos via upsert
- Expõe `isUserOnline(userId)` e `getLastSeen(userId)` 
- Mostra "Online", "Visto há 5 min", "Visto ontem" etc. em vez de "Online" falso

**Integração:**
- Chat.tsx e ChatFornecedor.tsx usam o hook para mostrar status real
- ChatFornecedor mostra nome e foto reais do perfil (já busca, mas fallback é "Cliente")

---

### Parte 3: Redesign Visual do Chat (Estilo Referência)

**Chat do Cliente (`Chat.tsx`):**

- **Header com gradiente**: Fundo com gradiente roxo Nellor (from-primary to-primary/80) com título "Mensagens" em branco
- **Barra de busca**: Input de pesquisa logo abaixo do header para filtrar fornecedores por nome
- **Seção de Status (Stories)**: Carrossel horizontal abaixo da busca com avatares circulares dos fornecedores que postaram status. Borda gradiente roxo quando há status não visto. Primeiro item = "Buscar" para encontrar novos fornecedores
- **Lista de conversas**: Cards com cantos arredondados, foto de perfil real, nome, última mensagem, horário, badge de não lidos
- **Fornecedores fixados**: Seção "Fixados" no topo da lista com ícone de pin

**Chat do Fornecedor (`ChatFornecedor.tsx`):**
- Mesmo estilo visual adaptado
- Nomes e fotos reais dos clientes (corrigir fallback "Cliente")
- Status de presença real

**Tela de conversa individual:**
- Header com gradiente roxo, avatar, nome, status real
- Bolhas de mensagem arredondadas (sent = primary, received = white)
- Timestamps e read receipts (já existem)

---

### Parte 4: Sistema de Status (Stories) dos Fornecedores

**Componente `SupplierStories.tsx`:**
- Carrossel horizontal de avatares com borda gradiente (não visto) ou cinza (já visto)
- Ao tocar, abre viewer fullscreen com progresso animado (barra no topo)
- Swipe para próximo/anterior
- Botão "Entrar em contato" fixo embaixo de cada story → abre chat com o fornecedor
- Exibe contagem de visualizações para o fornecedor

**Componente `StoryViewer.tsx`:**
- Modal fullscreen com fundo escuro
- Barra de progresso no topo (auto-avança em 5s por story)
- Avatar + nome do fornecedor no topo
- Conteúdo (imagem ou texto com fundo gradiente)
- Botão "Entrar em contato" na parte inferior
- Tap esquerda/direita para navegar

**Componente `CreateStoryModal.tsx` (painel fornecedor):**
- Dialog para criar novo status
- Opções: texto (com seleção de cor de fundo) ou upload de imagem
- Campo de legenda opcional
- Preview antes de publicar

**Hook `useSupplierStories.tsx`:**
- CRUD de stories com Supabase
- Filtra automaticamente stories expirados (>24h)
- Registra visualizações
- Realtime subscription para novos stories

---

### Parte 5: Busca de Fornecedores no Chat

**Botão "Novo chat" ou "Buscar fornecedor":**
- Abre modal/sheet com lista de todos os fornecedores (da tabela stores)
- Input de busca para filtrar
- Ao selecionar, abre conversa direta (mesmo sem histórico)

---

### Arquivos a Criar
- `supabase/migrations/xxx_supplier_stories.sql` — tabelas stories, views, campo last_seen_at, pinned_suppliers
- `src/hooks/usePresence.tsx` — presença real via Realtime
- `src/hooks/useSupplierStories.tsx` — CRUD de stories
- `src/components/chat/SupplierStories.tsx` — carrossel de stories
- `src/components/chat/StoryViewer.tsx` — viewer fullscreen
- `src/components/chat/CreateStoryModal.tsx` — criação de story
- `src/components/chat/SearchSuppliersSheet.tsx` — busca de fornecedores

### Arquivos a Editar
- `src/pages/cliente/Chat.tsx` — redesign completo com stories, busca, presença real, fixar fornecedores
- `src/pages/fornecedor/ChatFornecedor.tsx` — redesign visual, presença real, nomes/fotos reais, botão criar story
- `src/hooks/useSupabaseMessages.tsx` — integrar presença

