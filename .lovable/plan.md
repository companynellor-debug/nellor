

# Plano: Correção de 5 Bugs Críticos da Plataforma Nellor

## Análise do Estado Atual

Após análise do código, identifiquei o status de cada problema:

1. **Deduplicação de push** -- Já parcialmente implementada na edge function (linhas 236-264), mas a dedup acontece DEPOIS do envio da push. Precisa mover a verificação para ANTES do envio.
2. **Push em background** -- O SW (`src/sw.ts`) já tem handlers de `push` e `notificationclick`. VitePWA compila via `injectManifest`. O SW está correto para background push. Não há bug aqui -- o problema é que o SW usa workbox injectManifest que requer build. Em dev/preview pode não funcionar.
3. **Confetti** -- Já usa `canvas-confetti` com 150 partículas e `confetti.reset()` após 3s. Está correto nos dois arquivos (`CheckoutSucesso.tsx` e `StepConcluido.tsx`).
4. **Performance admin** -- Já usa `React.lazy` + `Suspense` em TODAS as rotas. A aba de notificações já tem paginação de 20 itens. O problema real é que `useAdminNotifications` busca dados de `orders` e transforma em notificações fake -- não busca da tabela `notifications` real.
5. **Aba de notificações admin** -- O hook `useAdminNotifications` NÃO busca da tabela `notifications`. Ele fabrica notificações a partir de `orders`. Precisa buscar da tabela `notifications` real e também manter os dados de orders.

## Alterações Necessárias

### 1. Edge Function `send-push-notification` -- Dedup ANTES do envio
**Arquivo:** `supabase/functions/send-push-notification/index.ts`

Mover a verificação de duplicata para ANTES de buscar subscriptions e enviar push. Se já existe notificação igual nos últimos 5 min, retornar imediatamente sem enviar nada.

Mudança: após validar campos obrigatórios (linha 163-168), adicionar check de dedup. Se duplicata encontrada, retornar `{ skipped: true, reason: "duplicate" }` sem processar push nem inserir.

### 2. Service Worker -- Sem alteração necessária
O `src/sw.ts` já tem handlers completos para `push`, `notificationclick`, `notificationclose` e `message`. O VitePWA com `injectManifest` compila corretamente. Push notifications em background dependem da subscription estar ativa no servidor -- isso é responsabilidade da edge function, não do SW.

### 3. Confetti -- Sem alteração necessária
Já usa `canvas-confetti` com 150 partículas e cleanup de 3s em ambos os arquivos.

### 4 e 5. Admin Notificações -- Reescrever hook para buscar dados reais
**Arquivo:** `src/hooks/useAdminNotifications.tsx`

O problema central: o hook busca `orders` e fabrica notificações fake. Precisa TAMBÉM buscar da tabela `notifications` do Supabase.

Mudança:
- Adicionar query à tabela `notifications` (sem filtro de user_id, pois o admin tem RLS ALL)
- Combinar notificações reais do banco com as derivadas de orders
- Manter paginação e cache existentes
- A query de notifications deve trazer: `id, user_id, title, body, type, read, created_at, data`

**Arquivo:** `src/pages/admin/NotificacoesAdmin.tsx`

Adicionar filtro por lida/não lida:
- Adicionar toggle ou botões "Todas / Não lidas / Lidas"
- Exibir destinatário (user_id) quando disponível

## Ordem de Execução

1. Fix dedup na edge function (mover check para antes do envio)
2. Reescrever `useAdminNotifications` para buscar da tabela `notifications` real
3. Atualizar `NotificacoesAdmin.tsx` com filtro lida/não lida

