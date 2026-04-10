

## Adaptação: Remover Lógica de Pagamento e Simplificar Cancelamento

### Contexto
A plataforma não processa pagamentos — são feitos diretamente entre as partes. O código atual tem referências a `payment_status`, taxas da plataforma, e regras de cancelamento baseadas em pagamento que não se aplicam.

### Mudanças

**1. Migração SQL — Simplificar trigger de cancelamento**
- Remover checagem de `payment_status` do trigger `validate_order_status_transition`
- Novas regras de cancelamento:
  - **Comprador**: pode cancelar se status é `pending` (antes do fornecedor aceitar)
  - **Fornecedor**: pode cancelar se status é `pending` ou `preparing` (antes de enviar)
  - **Ninguém** cancela após `shipped` ou `delivered`

**2. Fornecedor (`Pedidos.tsx`)**
- Remover toda seção de `payment_status` (badges, resumo financeiro, taxa Nellor, valor líquido)
- Remover `getPaymentStatusBadge`, `getTransferStatus`, `calculateOrderBreakdown`
- Simplificar botão de cancelar: mostrar quando status é `pending` ou `preparing`, sem checagem de pagamento
- Remover mensagens sobre "pedido já pago"

**3. Cliente (`MeusPedidos.tsx`)**
- Remover referências a `payment_status` e `getPaymentStatusInfo`
- Manter botão "Cancelar Pedido" apenas quando `pending`
- Remover ícone/import `CreditCard` se não usado em outro lugar

**4. Hook (`useSupabaseOrders.tsx`)**
- Remover referências desnecessárias a `payment_status` na lógica de UI (manter o campo no tipo caso o banco tenha)

### Resultado
Interface limpa, sem campos de pagamento irrelevantes, com regras de cancelamento simples e claras baseadas apenas no status do pedido.

