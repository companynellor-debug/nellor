

# Plano: Adaptar "Meus Pedidos" para "Minhas Negociações" no Perfil do Cliente

## O que muda

A seção "Meus Pedidos" com os 3 ícones (A Pagar, A Enviar, A Receber) será substituída por uma seção "Minhas Negociações" com 3 status do fluxo de negociação:

- **Pendentes** (amarelo, ícone Clock) — negociações com status `pending` ou `accepted`
- **Em Envio** (azul, ícone Package) — negociações com status `shipped`
- **Concluídas** (verde, ícone CheckCircle) — negociações com status `delivered`

O link "Ver histórico" apontará para `/cliente/negociacoes` em vez de `/cliente/meus-pedidos`.

## Arquivo modificado

**`src/pages/cliente/Perfil.tsx`**:
- Importar `useNegotiations` para contar negociações por status
- Remover importação e uso de `useSupabaseOrders` (não mais necessário)
- Remover variáveis `pendingPayment`, `toShip`, `toReceive`
- Substituir o card "Meus Pedidos" por "Minhas Negociações" com os 3 novos botões
- Cada botão navega para `/cliente/negociacoes` (página já existente)
- Trocar título de "Meus Pedidos" para "Minhas Negociações"
- Manter o mesmo visual dos círculos coloridos com badges de contagem

