

## Plan: Segurança Anti-Fraude nas Negociações + Correção da Busca de Fornecedores

### Problema 1: Negociações podem ser forjadas em segundos
Atualmente, um comprador cria uma negociação, o fornecedor aceita, marca como enviado, e o comprador confirma entrega -- tudo no mesmo segundo. Isso permite forjar pedidos e avaliações falsas.

### Problema 2: Busca de fornecedores no comparativo não funciona
A condição na linha 316 esconde os fornecedores quando há mais de 5 e o usuário não digitou nada. Com apenas 6 fornecedores, nunca mostra a lista. Além disso, o nome digitado "tec fornece" não bate com "pet fornece" que existe na base.

---

### Solução 1: Tempo mínimo entre transições de status (Anti-Fraude)

**Migração SQL** -- Criar uma função `validate_negotiation_transition()` como trigger BEFORE UPDATE que:
- `pending → accepted`: mínimo **1 hora** desde `created_at`
- `accepted → shipped`: mínimo **24 horas** desde que foi aceito (`updated_at` quando mudou para accepted)
- `shipped → delivered`: mínimo **48 horas** desde que foi marcado como enviado (`shipping_confirmed_at`)
- Bloqueia qualquer tentativa de pular etapas (ex: `pending → delivered`)
- Valida que só o `buyer_id` pode confirmar entrega e só o `supplier_id` pode marcar envio

**Frontend** -- Adicionar feedback visual:
- Em `useNegotiations.tsx`: antes de chamar update, verificar tempo mínimo no frontend também (UX) e mostrar mensagem clara: "Você poderá confirmar envio a partir de [data/hora]"
- Em `Negociacoes.tsx` (fornecedor): desabilitar botões com countdown mostrando quando a ação estará disponível
- Em `MinhasNegociacoes.tsx` (cliente): desabilitar "Sim, recebi" com countdown de 48h após envio

### Solução 2: Correção da Busca de Fornecedores

Em `CompararFornecedores.tsx`:
- Remover a condição `!pickerSearch && filteredPickers.length > 5` -- sempre mostrar todos os fornecedores disponíveis
- Mostrar resultados imediatamente conforme o usuário digita (já funciona, só o threshold que bloqueia)

---

### Arquivos modificados
1. **Nova migração SQL**: trigger `validate_negotiation_transition` com tempos mínimos e validação de roles
2. `src/hooks/useNegotiations.tsx` -- adicionar verificação de tempo mínimo no frontend + mensagens de erro claras
3. `src/pages/fornecedor/Negociacoes.tsx` -- desabilitar botões com countdown
4. `src/pages/cliente/MinhasNegociacoes.tsx` -- desabilitar confirmação com countdown de 48h
5. `src/pages/cliente/CompararFornecedores.tsx` -- remover threshold de 5, sempre mostrar lista

### Tempos mínimos propostos

```text
pending → accepted:   1 hora   (fornecedor precisa analisar)
accepted → shipped:  24 horas  (tempo real de preparação)
shipped → delivered: 48 horas  (tempo real de entrega)
```

Esses tempos são enforced no banco de dados (trigger), impossível burlar pelo frontend.

