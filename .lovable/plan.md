

## Plano: Limpeza Completa do Modelo de Pagamento Legado

### 1. Migração SQL (uma única migração grande)

**Tabelas a remover:**
- `transactions` (1 registro)
- `payouts` (1 registro) — remover triggers primeiro (`update_payouts_updated_at`, `payout_notification_trigger`, `trg_payouts_notify_changes`)
- `payment_methods` (1 registro)
- `refund_requests` (1 registro)
- `coupons` (1 registro) — remover referências em edge functions

**Colunas a remover de `profiles`:**
- `stripe_account_id`, `stripe_ready`, `pix_key`

**Colunas a remover de `orders`:**
- `stripe_session_id`, `stripe_payment_intent_id`, `stripe_payment_amount`, `platform_fee`, `supplier_amount`, `payment_status`, `payment_status_label`, `status_label`, `paid_at`
- Triggers a remover/atualizar em `orders`:
  - `trg_set_order_status_on_payment` / `trg_orders_set_status_on_payment` (usa `payment_status`)
  - `update_stock_on_payment` / `trg_orders_update_stock` / `trg_orders_update_product_stock` (usa `payment_status`)
  - `update_analytics_trigger` / `trg_orders_update_supplier_analytics` (usa `payment_status`)
  - `orders_on_paid_create_affiliate_commission` (usa `payment_status`)
  - Atualizar `notify_order_changes()` para não referenciar `payment_status`
- Funções a remover: `set_order_status_on_payment()`, `update_product_stock()`, `update_supplier_analytics()`, `notify_payout_changes()`

**Colunas a remover de `drop_orders`:**
- `platform_fee`, `supplier_amount`, `payment_status`, `paid_at`

**Criar tabela `messages_archive`:**
- Mesma estrutura de `messages`
- Não será acessada pelo chat, apenas pelo admin para auditoria

**Criar índices faltantes:**
- `idx_messages_created_at` em `messages(created_at)`
- `idx_negotiations_supplier_id` em `negotiations(supplier_id)`
- `idx_negotiations_buyer_id` em `negotiations(buyer_id)`
- `idx_orders_buyer_id` em `orders(buyer_id)`
- `idx_orders_supplier_id` em `orders(supplier_id)`
- `idx_notifications_user_id` em `notifications(user_id)`
- `idx_products_supplier_id` em `products(supplier_id)`

**Limpeza de dados órfãos** (via insert tool, não migração):
- Deletar notificações sem `user_id` válido
- Deletar produtos sem `supplier_id` válido

### 2. Edge Functions a deletar
- `check-coupon-alerts` (referencia tabela `coupons` que será removida)
- Remover entrada em `supabase/config.toml`

### 3. Frontend — Arquivos a remover completamente
- `src/components/fornecedor/WithdrawalModal.tsx`
- `src/components/fornecedor/VerificationForm.tsx`
- `src/components/fornecedor/VerificationStatusBanner.tsx`
- `src/components/fornecedor/FeeTransparency.tsx`
- `src/components/fornecedor/StripeBanner.tsx`
- `src/hooks/useIdentityVerification.ts`
- `src/hooks/useCoupons.tsx`
- `src/hooks/useSupplierCoupons.tsx`
- `src/hooks/usePaymentMethods.tsx`
- `src/hooks/useSupabasePaymentMethods.tsx`
- `src/pages/fornecedor/Cupons.tsx`
- `src/pages/fornecedor/RelatorioCupons.tsx`
- `src/components/checkout/StepStripePayment.tsx`
- `src/components/checkout/StepPagamento.tsx` (usa cupons)
- `supabase/functions/check-coupon-alerts/index.ts`

### 4. Frontend — Arquivos a editar

**`src/App.tsx`:**
- Remover rotas: cupons, relatorio-cupons do fornecedor
- Remover importação do `AdminFinanceiro` e rota `/admin/financeiro`
- Remover lazy imports dos arquivos deletados

**`src/components/fornecedor/SupplierSidebar.tsx`:**
- Remover item "Financeiro" do menu

**`src/components/fornecedor/BottomNav.tsx`:**
- Remover item "Financeiro" do bottom nav

**`src/components/admin/AdminSidebar.tsx`:**
- Remover item "Financeiro" do menu admin

**`src/pages/fornecedor/Financeiro.tsx`:**
- Manter — é a página de referência de negociações (não tem saldo/saque)

**`src/pages/admin/Financeiro.tsx`:**
- Remover completamente (GMV, taxas, repasses)

**`src/pages/admin/Relatorios.tsx`:**
- Remover referências a GMV e receita Nellor (que usava `platform_fee`)

**`src/hooks/useAdminNotifications.tsx`:**
- Remover referência a `platform_fee` na linha 144

**`src/pages/drop/DropFinanceiro.tsx`:**
- Remover botão "Solicitar Saque"

**`src/pages/drop/DropConfiguracoes.tsx`:**
- Remover botão "Configurar método de saque"

**`src/pages/fornecedor/Planos.tsx`:**
- Remover textos sobre saques

**`src/pages/cliente/ConfiguracoesNotificacoes.tsx`:**
- Remover/ajustar referência a "Cupons, descontos"

**`supabase/functions/admin-user-actions/index.ts`:**
- Remover linhas que deletam `coupons`

**`supabase/config.toml`:**
- Remover entrada `[functions.check-coupon-alerts]`

### 5. Arquivamento de mensagens (pg_cron)
- Será configurado via insert tool (não migração) após a tabela `messages_archive` ser criada
- Job diário à meia-noite: mover mensagens > 60 dias para `messages_archive`, deletar da tabela principal

### Resumo de impacto
- ~15 arquivos frontend removidos
- ~10 arquivos frontend editados
- 5 tabelas SQL removidas
- ~10 colunas removidas de tabelas existentes
- ~8 triggers/funções removidos
- 1 edge function deletada
- 1 tabela nova (`messages_archive`)
- 7+ índices criados
- Nenhuma funcionalidade ativa quebrada — tudo removido já era legado/inativo

