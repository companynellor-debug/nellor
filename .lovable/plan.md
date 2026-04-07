

# Plano: Corrigir Layout Mobile do Painel do Fornecedor (Todas as Abas)

## Problemas Identificados

1. **Dashboard** — Cards cortados na lateral direita (foto 2). O grid `grid-cols-2` está estourando por conta de padding/gap acumulados.
2. **Negociações** — Cards de negociação com conteúdo vazando, botões de ação desalinhados no mobile.
3. **Chat** — Altura do chat mobile não considera a BottomNav (64px), cortando o input.
4. **Financeiro** — Layout ok mas cards financeiros podem melhorar no mobile (grid-cols-1 em telas pequenas já está, mas valores longos podem estourar).
5. **Estatísticas** — Ainda usa o modelo antigo de orders/pedidos/GMV/comissão 7.5%. Precisa ser reescrito para negociações.

---

## 1. Dashboard — Corrigir cards cortados

**Arquivo**: `src/pages/fornecedor/Dashboard.tsx`

- Reduzir gap do grid de `gap-2` para `gap-1.5` no mobile
- Garantir que cada card tenha `overflow-hidden` e todo texto com `truncate`
- Reduzir padding interno dos cards no mobile

## 2. Negociações — Otimizar layout mobile

**Arquivo**: `src/pages/fornecedor/Negociacoes.tsx`

- Grid de detalhes: mudar de `grid-cols-2` para `grid-cols-1` no mobile
- Botões de ação: empilhar verticalmente com `flex-col` no mobile
- Textos longos (produto, comprador) com `truncate`
- Reduzir padding dos cards

## 3. Chat — Ajustar altura considerando BottomNav

**Arquivo**: `src/pages/fornecedor/ChatFornecedor.tsx`

- Mudar altura do chat mobile de `h-[calc(100vh-4rem)]` para `h-[calc(100vh-4rem-4rem)]` (desconta header + BottomNav)
- Lista de conversas mobile: garantir `overflow-x-hidden`

## 4. Financeiro — Ajustes finos mobile

**Arquivo**: `src/pages/fornecedor/Financeiro.tsx`

- Valores monetários grandes: usar `text-lg` ao invés de `text-xl` no mobile
- Cards de resumo: garantir `min-w-0` e `truncate` nos valores
- Padding bottom para BottomNav

## 5. Estatísticas — Reescrever para modelo de negociações

**Arquivo**: `src/pages/fornecedor/Estatisticas.tsx`

Reescrever completamente removendo referências a orders, vendas, comissão 7.5% e saldo para saque.

### Novas métricas (baseadas em negociações):
- **Total Negociado** — soma dos valores de todas as negociações entregues
- **Total de Negociações** — contagem total
- **Ticket Médio** — valor médio por negociação entregue

### Gráfico:
- Trocar "Produtos Mais Vendidos" por "Negociações por Mês" (últimos 6 meses)

### Remover:
- Card "Saldo Disponível para Saque" com comissão 7.5%
- Toda referência a `orders`, `payment_status`, `supplier_amount`
- Buscar dados de `negotiations` ao invés de `orders`

### Layout mobile:
- Grid `grid-cols-1` no mobile, `grid-cols-3` no desktop
- Gráfico com `min-w-0` e `overflow-hidden`

---

## Detalhes técnicos

- Nenhuma migração de banco necessária
- Todas as mudanças são de frontend (layout + dados)
- O container pai (`FornecedorLayout`) já tem `overflow-x-hidden` — o problema está nos filhos com padding/gap que acumulam largura

