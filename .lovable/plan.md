

## Plano: Sistema de Planos, Conquistas Mensais, Meta de Faturamento e Métodos de Pagamento/Envio do Fornecedor

Este plano cobre 4 grandes funcionalidades solicitadas. A implementação será dividida em etapas claras.

---

### 1. Novos Planos de Assinatura (5 tiers)

**Database**: Migration para atualizar `supplier_subscriptions` com campo `max_products` e atualizar a RPC `get_supplier_subscription` para retornar o plano com limite de produtos.

| Plano | Produtos | Preço |
|-------|----------|-------|
| Grátis | 10 | R$ 0 |
| Inicial | 50 | R$ 39,90 |
| Intermediário | 170 | R$ 67,90 |
| Avançado | 500 | R$ 149,00 |
| Ultra | Ilimitado | R$ 249,00 |

**Arquivos**:
- `src/pages/fornecedor/Planos.tsx` — Reescrever com 5 cards horizontais (scroll no mobile), cada um com nome, preço, limite de produtos e benefícios
- `src/hooks/useSupplierSubscription.tsx` — Atualizar interface para incluir `max_products`, `plan_name` atualizado
- `src/components/fornecedor/SubscriptionBanner.tsx` — Ajustar para novos nomes de plano
- Adicionar rota `/fornecedor/planos` no `App.tsx` e link no `SupplierSidebar.tsx`
- Enforcement: bloquear cadastro de produto quando atingir limite do plano

### 2. Card de Conquistas Mensais (End-of-Month Highlight)

**Componente novo**: `src/components/fornecedor/MonthlyAchievements.tsx`

- Overlay com backdrop-blur sobre o dashboard
- Card centralizado estilo Apple com animações de entrada
- Dados mostrados:
  - Top 3 produtos mais negociados
  - Visitas no perfil (product_views)
  - Conversas iniciadas por clientes
  - Negociações fechadas (delivered)
  - Total vendido
  - Total de visualizações nos status
  - Comparação com mês anterior (setas verdes/vermelhas + %)
- Rodapé: "E tudo isso pagando apenas **R$ X/mês**" com o valor do plano ativo
- Lógica de exibição: mostrar uma vez por mês (salvar em `localStorage` a data do último dismiss)
- Botão "Fechar" e "Compartilhar" (screenshot/share API)

**Dados**: Query nas tabelas `negotiations`, `product_views`, `messages` filtrando por mês atual vs mês anterior

### 3. Meta de Faturamento no Header (estilo Kiwify)

**Componente novo**: `src/components/fornecedor/RevenueGoalBar.tsx`

- Barra de progresso no header do `FornecedorLayout.tsx`, abaixo do header existente
- Metas pré-definidas: R$ 500k, R$ 1M, R$ 2M, R$ 5M, R$ 10M, R$ 20M
- Auto-seleciona a próxima meta acima do faturamento atual
- Mostra: `R$ X / R$ Y` com barra animada e porcentagem
- Faturamento = soma de `agreed_price * quantity` das negociações `delivered`
- Clicável para alterar meta manualmente (salvar em `profiles` ou `localStorage`)

### 4. Métodos de Pagamento e Formas de Envio do Fornecedor

**Database**: Migration para criar duas novas tabelas:

```sql
CREATE TABLE supplier_payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL,
  method text NOT NULL, -- 'pix', 'transferencia', 'boleto', 'cartao_credito'
  enabled boolean DEFAULT true,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE supplier_shipping_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL,
  method text NOT NULL, -- 'correios_pac', 'correios_sedex', 'transportadora_propria', 'fob'
  enabled boolean DEFAULT true,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
```

Com RLS para fornecedores gerenciarem os próprios e leitura pública.

**Arquivos**:
- `src/pages/fornecedor/Configuracoes.tsx` — Adicionar seções de "Métodos de Pagamento Aceitos" e "Formas de Envio" com checkboxes
- `src/hooks/useSupplierPaymentMethods.tsx` — CRUD hook
- `src/hooks/useSupplierShippingMethods.tsx` — CRUD hook
- `src/components/chat/NegotiationForm.tsx` — Filtrar `paymentMethodOptions` para mostrar apenas os métodos aceitos pelo fornecedor. Adicionar seleção de forma de envio

### Resumo de Arquivos

| Ação | Arquivo |
|------|---------|
| Criar | `src/components/fornecedor/MonthlyAchievements.tsx` |
| Criar | `src/components/fornecedor/RevenueGoalBar.tsx` |
| Criar | `src/hooks/useSupplierPaymentMethods.tsx` |
| Criar | `src/hooks/useSupplierShippingMethods.tsx` |
| Reescrever | `src/pages/fornecedor/Planos.tsx` |
| Editar | `src/hooks/useSupplierSubscription.tsx` |
| Editar | `src/components/fornecedor/SubscriptionBanner.tsx` |
| Editar | `src/pages/fornecedor/FornecedorLayout.tsx` |
| Editar | `src/pages/fornecedor/Dashboard.tsx` |
| Editar | `src/pages/fornecedor/Configuracoes.tsx` |
| Editar | `src/components/fornecedor/SupplierSidebar.tsx` |
| Editar | `src/components/chat/NegotiationForm.tsx` |
| Editar | `src/App.tsx` |
| Migration | Tabelas `supplier_payment_methods`, `supplier_shipping_methods` + update `supplier_subscriptions` |

