

# Plano: Adicionar MRR na Dashboard e Adaptar Indicadores para Assinaturas

## Resumo

O Dashboard admin já tem o card de "Assinaturas Ativas" mas falta o **MRR (Monthly Recurring Revenue)**. A aba de Indicadores ainda está toda baseada em pedidos/GMV/comissão 7.5% — precisa ser reescrita para refletir o modelo de assinaturas (R$ 29/mês).

---

## 1. Dashboard — Adicionar card de MRR

**Arquivo**: `src/pages/admin/Dashboard.tsx`

- Adicionar um novo card no `statsCards` com o **MRR**: quantidade de assinaturas ativas × R$ 29
- O dado já está disponível via `subscriptions` (já carregado no useEffect)
- Cálculo: `activeSubscriptions * 29`
- Card com ícone TrendingUp, cor emerald/green, subtítulo mostrando quantidade de assinaturas ativas

---

## 2. Indicadores — Reescrever para modelo de assinaturas

**Arquivo**: `src/pages/admin/Indicadores.tsx`

Remover toda a lógica baseada em orders/GMV/comissão e substituir por métricas de assinaturas:

### Dados a buscar
- Carregar `supplier_subscriptions` via query direta (mesma abordagem do Dashboard)
- Carregar `profiles` via `useAdminProfiles` para contar fornecedores

### Cards principais (4 cards)
1. **MRR Atual** — assinaturas ativas × R$ 29
2. **Assinaturas Ativas** — contagem de status `active`
3. **Assinaturas Pendentes** — contagem de status `pending`
4. **Churn / Expiradas** — contagem de status `expired` ou `cancelled`

### Seção: Valuation Estimado
- Manter a fórmula MRR × 12 × multiplicador (ou MRR × 18 como já existe)
- Baseado no MRR real de assinaturas

### Seção: Receita do Proprietário
- Simplificar: MRR total = receita do Natan (100%)

### Gráfico: Evolução Mensal do MRR
- Agrupar assinaturas por mês de `started_at`
- Mostrar evolução do MRR nos últimos 6 meses

### Resumo Executivo
- Total de assinaturas (histórico)
- MRR atual
- ARR (MRR × 12)
- Taxa de conversão (ativas / total)

### Remover
- Toda referência a GMV, pedidos pagos, comissão 7.5%, ticket médio baseado em orders
- Import de `useAdminOrders`

---

## Detalhes técnicos

- Nenhuma migração de banco necessária — os dados de `supplier_subscriptions` já existem
- O preço fixo de R$ 29 pode ser lido do campo `price` de cada assinatura ativa (para futuro suporte a planos diferentes)
- Filtros de período serão mantidos nos Indicadores para filtrar por `started_at` das assinaturas

