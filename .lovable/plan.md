
## Plano revisado: travar cancelamento sem depender do fornecedor

### Correção principal
O ponto fraco do plano anterior era confiar no fornecedor marcar “cliente pagou”. Isso não protege o comprador, porque o fornecedor poderia simplesmente não marcar e cancelar do mesmo jeito.

A trava correta precisa nascer do lado do comprador:

- o comprador informa que pagou
- anexa um comprovante simples ou informa o código/referência da transação
- a partir daí o fornecedor perde a permissão de cancelar

Depois disso, o fornecedor só pode:
- confirmar que localizou o pagamento
- seguir com o envio
- ou contestar o pagamento com um motivo, sem cancelar

```text
Status da negociação continua:
pending -> accepted -> shipped -> delivered

Subfluxo de pagamento offline:
not_reported -> reported_by_buyer -> confirmed_by_supplier
                              \-> contested_by_supplier
```

## Fase 1 — Segurança anti-fraude no pagamento offline

### Regras novas
- Comprador:
  - pode cancelar só enquanto ainda não houve aceite do fornecedor
  - não pode cancelar depois de informar que pagou
- Fornecedor:
  - pode cancelar só antes do envio e só se não existir pagamento informado pelo comprador
  - depois que o comprador informar pagamento, não pode cancelar nem recusar
- Após `shipped` ou `delivered`, ninguém cancela
- Se houver problema, vira contestação e fica auditável, não cancelamento silencioso

### Banco de dados
Adicionar campos neutros de pagamento offline em `negotiations` e espelhar em `orders` enquanto essas telas continuarem expostas:
- `payment_state`
- `payment_reported_at`
- `payment_proof_url`
- `payment_reference`
- `payment_confirmed_at`
- `payment_contested_reason`

### Trigger / validação
Atualizar os triggers para:
- bloquear cancelamento do fornecedor quando `payment_state != 'not_reported'`
- exigir motivo se o fornecedor contestar pagamento
- permitir ao comprador informar pagamento só após o fornecedor aceitar
- manter as travas atuais de envio/entrega

Importante: o checkbox do fornecedor “localizei o pagamento” vira só um registro auxiliar. Ele não controla a trava de cancelamento.

## Fase 2 — UX leve, sem burocracia

### Comprador
Na negociação aceita:
- botão `Já paguei`
- upload rápido de comprovante ou campo curto de referência
- badge `Pagamento informado`
- botão de cancelar some assim que o pagamento for informado

### Fornecedor
Na tela de negociações/pedidos:
- mostrar claramente `Pagamento informado pelo cliente`
- ações:
  - `Confirmar recebimento`
  - `Não localizei o pagamento`
- esconder `Cancelar/Recusar` quando já existir pagamento informado

### Checklist do fornecedor
Ao aceitar a negociação/pedido, usar um checklist curto e útil:
- estoque disponível
- prazo combinado
- forma de envio definida

Se quiser, pode ter a pergunta “já localizei o pagamento?”, mas isso não será mais a proteção principal.

## Fase 3 — Formulário de negociação inteligente

### Ajuste principal
Remover a dependência de o comprador digitar “valor combinado” manualmente.

### Novo fluxo
O comprador informa:
- produto
- quantidade
- endereço/dados fiscais
- observações

O sistema calcula automaticamente o valor de referência com base em:
- `sale_unit`
- `units_per_sale_unit`
- `min_order_quantity` / `max_order_quantity`
- `product_price_tiers` quando existir

Exemplos de exibição:
- `R$ 120,00 por caixa`
- `3 caixas = 36 unidades`
- `R$ 360,00 total estimado`

Se o fornecedor quiser ajustar o valor final, isso acontece na aceitação da negociação, não jogando a conta para o comprador.

## Fase 4 — Dados para NF e compartilhamento simples

### Coleta de dados
No `Registrar Negociação`, adicionar uma seção leve e pré-preenchida com:
- nome / razão social
- CPF/CNPJ
- IE opcional
- endereço
- telefone

Esses dados devem vir do endereço padrão/perfil e ser salvos como snapshot da negociação.

### NF
Não criar emissor fiscal agora.
O fluxo prático será:
- fornecedor vê os dados já preenchidos para emitir fora da plataforma
- fornecedor faz upload da NF em PDF/imagem
- cliente visualiza/baixa a NF na própria negociação
- experiência parecida com compartilhar documento no WhatsApp, sem burocracia extra

## Fase 5 — Botões de cancelamento visíveis e consistentes

### Onde ajustar
- `MinhasNegociacoes.tsx`: mostrar cancelamento do comprador quando ainda estiver pendente
- `Negociacoes.tsx`: mostrar recusa/cancelamento do fornecedor só antes de pagamento informado
- `MeusPedidos.tsx` e `Pedidos.tsx`: espelhar exatamente a mesma trava, para não existir brecha entre telas

## Arquivos / áreas principais
- `supabase/migrations/*` — novos campos + regras dos triggers
- `src/hooks/useNegotiations.tsx`
- `src/components/chat/NegotiationForm.tsx`
- `src/pages/fornecedor/Negociacoes.tsx`
- `src/pages/cliente/MinhasNegociacoes.tsx`
- `src/hooks/useSupabaseOrders.tsx`
- `src/pages/fornecedor/Pedidos.tsx`
- `src/pages/cliente/MeusPedidos.tsx`

## Detalhes técnicos
- manter o fluxo de entrega atual; pagamento offline vira um subestado separado
- não usar `payment_status` legado como verdade principal desse fluxo
- exigir pelo menos um registro mínimo do comprador para travar o cancelamento: comprovante ou referência da transação
- salvar snapshots de preço/unidade/dados fiscais para o histórico não mudar se produto ou perfil forem editados depois
- quando o fornecedor contestar o pagamento, o registro continua ativo e auditável; não vira cancelamento silencioso
