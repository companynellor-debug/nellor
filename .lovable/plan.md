

## Correção: Cálculo automático por tipo de venda

### O bug
O código atual faz `totalEstimado = preçoUnitário × quantidade`, onde quantidade é em unidades de venda (caixas, fardos, etc). Para Caixa Fechada com 10 unidades a R$ 510/un, o total deveria ser R$ 5.100, mas mostra R$ 510.

### Lógica correta por tipo de venda

```text
unit / pair:
  total = preço × quantidade
  (preço já é por unidade/par)

closed_box:
  total = preço_por_unidade × units_per_sale_unit × quantidade
  exibir: "R$ 510/un × 10 un/cx × 1 cx = R$ 5.100"

bale:
  total = preço_por_unidade × units_per_sale_unit × quantidade
  exibir: "R$ X/un × Y un/fardo × Z fardos = R$ total"

kit:
  total = preço × quantidade
  (preço do kit já é o preço do conjunto completo)
```

### Mudanças em `NegotiationForm.tsx`

1. **Cálculo do total** (linha 88): Adaptar para multiplicar por `unitsPerSaleUnit` nos tipos `closed_box` e `bale`
2. **Preço efetivo dos tiers**: Os tiers armazenam `price_per_unit` — verificar se é por unidade ou por volume e ajustar
3. **Exibição no breakdown** (linhas ~280-310): Mostrar a decomposição correta:
   - Para caixa: "Preço por unidade: R$ 510 → 10 un/cx × 1 cx = R$ 5.100"
   - Para fardo: similar à caixa
   - Para unit/pair/kit: manter como está
4. **Valor salvo na negociação**: O `agreed_price` e `unit_price` devem refletir os valores corretos

### Arquivo modificado
- `src/components/chat/NegotiationForm.tsx` — apenas este arquivo precisa ser alterado

