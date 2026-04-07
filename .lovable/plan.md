

# Plano: Adaptar Nellor ao Modelo de Marketplace de Negociação

## Resumo

A Nellor precisa de uma grande adaptação para alinhar todas as áreas ao modelo de negociação (sem pagamento integrado). São 5 frentes principais:

---

## 1. Dashboard Admin — Remover métricas financeiras e adaptar ao modelo de negociação

**Problema**: O dashboard admin ainda mostra GMV, comissão 7.5%, receita Nellor, distribuição de receita — tudo de um modelo e-commerce que não existe mais.

**Solução**:
- Substituir cards financeiros por métricas relevantes: Total de Usuários, Fornecedores Ativos, Negociações Registradas, Conversas Ativas, Disputas Abertas, Assinaturas Ativas/Pendentes
- Gráfico de evolução: negociações por dia (não pedidos pagos)
- Top Fornecedores por número de negociações (não por receita)
- Remover gráfico de distribuição de receita e receita Nellor
- Manter tabela de "Negociações Recentes" no lugar de "Pedidos Recentes"

---

## 2. Painel Fornecedor — Remover verificação de identidade e saque

**Problema**: Dashboard do fornecedor tem card de "verificação de identidade" (localStorage), Financeiro tem sistema de saque, Recebimentos tem verificação de conta — tudo faz referência a um gateway de pagamento que não existe.

**Solução**:
- **Dashboard**: Remover card "Status de verificação de identidade" e referências a `useIdentityVerification`
- **Financeiro**: Reescrever completamente — remover saque, saldo, verificação. Substituir por visão das negociações do fornecedor com valores acordados como referência informativa
- **Recebimentos**: Remover ou redirecionar para Financeiro adaptado
- **VerificationStatusBanner**: Remover do layout (já temos SubscriptionBanner para assinatura)
- **Sidebar e BottomNav**: Remover item "Permissões" (que levava à verificação), simplificar menu

---

## 3. Assinatura — Corrigir banner e fluxo

**Problema**: O `SubscriptionBanner` usa o hook `useSupplierSubscription` que chama RPC `get_supplier_subscription`, mas pode estar falhando silenciosamente.

**Solução**:
- Verificar e corrigir o hook para tratar caso de RPC retornando vazio
- Garantir que o banner aparece corretamente para fornecedores sem assinatura (needsSubscription)
- Adicionar lógica no layout para redirecionar fornecedores sem assinatura ativa para a página de assinatura

---

## 4. Negociações → Pedidos do Fornecedor (Fluxo Completo)

**Problema**: Após registrar negociação no chat, ela aparece na dashboard do fornecedor como métrica mas não como "pedido" gerenciável. O fornecedor não consegue confirmar envio nem descontar estoque.

**Solução**:
- Criar página **"Negociações"** no painel do fornecedor (substituir ou complementar "Pedidos"):
  - Lista todas as negociações onde `supplier_id = user.id`
  - Status flow: `pending` → `accepted` (fornecedor aceita) → `shipped` (fornecedor confirma envio) → `delivered` (comprador confirma recebimento)
  - Fornecedor tem botões: "Aceitar Negociação", "Confirmar Envio"
  - Ao comprador confirmar recebimento → desconto automático do estoque na tabela `products` (campo `estoque`)
- Adicionar campo `supplier_confirmed_shipping` e `shipping_confirmed_at` na tabela negotiations (migração)
- Criar RPC ou trigger para descontar estoque ao status mudar para `delivered`
- Adaptar a página existente de Pedidos do fornecedor para mostrar negociações ao invés de orders

---

## 5. Variações em Caixa Fechada (e outros tipos)

**Problema**: Caixa fechada exige cadastro separado para cada variação. O usuário quer que um único produto "Caixa Fechada de Xiaomi" tenha variações (modelos diferentes), cada uma com foto, descrição, preço e estoque próprios.

**Solução**:
- Adicionar etapa de **Variações** ao fluxo de Caixa Fechada (atualmente não tem — `getStepsForSaleType('closed_box')` pula variações)
- Cada variação de caixa fechada terá: nome/modelo, foto, descrição curta, preço, estoque, quantidade por caixa
- Reutilizar e adaptar o `VariationsEditor` existente para suportar campos extras (descrição e foto por variação)
- O mesmo se aplica a Fardo e outros tipos — adicionar step de variações onde faz sentido
- Na página do produto no marketplace, mostrar seletor de variação com foto e descrição de cada opção

---

## Arquivos que serão criados/modificados

### Novos:
- `src/pages/fornecedor/Negociacoes.tsx` — Página de gestão de negociações do fornecedor

### Modificados:
- `src/pages/admin/Dashboard.tsx` — Métricas de negociação, não financeiras
- `src/pages/fornecedor/Dashboard.tsx` — Remover verificação identidade
- `src/pages/fornecedor/FornecedorLayout.tsx` — Remover `VerificationStatusBanner`, melhorar lógica de assinatura
- `src/pages/fornecedor/Financeiro.tsx` — Reescrever para modelo de negociação
- `src/pages/fornecedor/Recebimentos.tsx` — Remover ou redirecionar
- `src/components/fornecedor/SupplierSidebar.tsx` — Trocar "Pedidos" por "Negociações", remover Permissões
- `src/components/fornecedor/BottomNav.tsx` — Idem
- `src/components/fornecedor/SubscriptionBanner.tsx` — Corrigir exibição
- `src/hooks/useSupplierSubscription.tsx` — Corrigir tratamento de dados
- `src/hooks/useNegotiations.tsx` — Adicionar status `shipped`, campos de envio
- `src/components/fornecedor/product-modal/types.ts` — Adicionar variações para caixa fechada
- `src/components/fornecedor/product-modal/BoxConfigStep.tsx` — Remover aviso de "cadastrar separado"
- `src/App.tsx` — Nova rota de negociações fornecedor
- **Migração SQL**: Adicionar campos na tabela negotiations, trigger de desconto de estoque

---

## Detalhes Técnicos

### Migração SQL
```sql
ALTER TABLE negotiations ADD COLUMN IF NOT EXISTS supplier_confirmed_shipping boolean DEFAULT false;
ALTER TABLE negotiations ADD COLUMN IF NOT EXISTS shipping_confirmed_at timestamptz;

-- Trigger para descontar estoque quando status muda para 'delivered'
CREATE OR REPLACE FUNCTION decrement_stock_on_delivery()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' AND NEW.product_id IS NOT NULL THEN
    UPDATE products SET estoque = GREATEST(estoque - NEW.quantity, 0) WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_decrement_stock_on_delivery
  BEFORE UPDATE ON negotiations
  FOR EACH ROW EXECUTE FUNCTION decrement_stock_on_delivery();
```

### Fluxo de status das negociações
```text
pending → accepted → shipped → delivered
                  ↘ cancelled
                           ↘ disputed
```

