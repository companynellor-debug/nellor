

## Fluxo Seguro de Pedidos: Confirmação Bilateral

### Problema Atual
O fornecedor pode marcar qualquer status livremente, inclusive "Entregue", sem confirmação do comprador. Isso é inseguro.

### Novo Fluxo

```text
pending → preparing → shipped → delivered
   │          │           │          │
Comprador  Fornecedor  Fornecedor  COMPRADOR
 criou     aprova e    marca       confirma
 pedido    prepara     envio +     recebimento
                       rastreio
```

- **pending**: Pedido criado, aguardando fornecedor aprovar
- **preparing**: Fornecedor aceitou e está preparando
- **shipped**: Fornecedor marcou como enviado (rastreio obrigatório)
- **delivered**: Somente o COMPRADOR pode confirmar recebimento

### Alterações

**1. Migração SQL - Trigger de validação**
- Criar função `validate_order_status_transition` que:
  - Impede pular etapas (ex: pending direto para delivered)
  - Impede fornecedor de marcar `delivered` (só buyer pode)
  - Impede buyer de marcar `preparing` ou `shipped` (só fornecedor pode)
  - Exige `tracking_code` ao mudar para `shipped`

**2. Frontend - Fornecedor (`Pedidos.tsx`)**
- Remover botão "Entregue" dos controles do fornecedor
- Manter apenas: Preparando, Enviado, Cancelar
- Ao clicar "Enviado", exigir código de rastreio antes
- Labels atualizados: `pending` = "Aguardando Aprovação"

**3. Frontend - Cliente (`MeusPedidos.tsx`)**
- Adicionar botão "Confirmar Recebimento" quando status = `shipped`
- Diálogo de confirmação antes de confirmar
- Atualizar ORDER_STEPS labels

**4. Hook (`useSupabaseOrders.tsx`)**
- Adicionar função `confirmDelivery(orderId)` exclusiva para buyers
- Atualizar labels de status

**5. Segurança**
- O trigger SQL garante no nível do banco que:
  - Transições inválidas são bloqueadas
  - Apenas o buyer pode marcar `delivered`
  - Apenas o supplier pode marcar `preparing`/`shipped`
  - Rastreio obrigatório para envio

### Arquivos Modificados
1. Nova migração SQL (trigger de validação)
2. `src/hooks/useSupabaseOrders.tsx` (adicionar `confirmDelivery`)
3. `src/pages/fornecedor/Pedidos.tsx` (remover botão Entregue, exigir rastreio)
4. `src/pages/cliente/MeusPedidos.tsx` (botão Confirmar Recebimento)

