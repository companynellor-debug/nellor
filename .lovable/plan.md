

## Plano: Fluxo Completo de Pagamento, Cancelamento e Reembolso

### Resumo dos problemas atuais
1. Cliente faz upload do comprovante só depois do fornecedor aceitar — deveria ser junto com o registro da negociação
2. Fornecedor consegue cancelar em qualquer etapa, inclusive depois de enviar — errado
3. Não existe fluxo de reembolso quando fornecedor cancela após pagamento
4. Não existe seleção de motivo obrigatória ao cancelar
5. Não há mensagem automática para admin quando fornecedor alega comprovante falso com os dados completos

### Novo fluxo proposto

```text
CLIENTE registra negociação + faz upload do comprovante
  ↓
FORNECEDOR recebe solicitação com comprovante anexado
  ├── Confirma pagamento + Aceita → ACEITA (não pode mais cancelar, só admin)
  ├── Nega pagamento:
  │     ├── Motivo: "Comprovante falso" → auto-disputa para admin
  │     └── Motivo: "Outro" → obrigado a reembolsar
  │           ├── Fornecedor marca "Reembolsei" → pergunta ao cliente
  │           │     ├── Cliente confirma → negociação cancelada
  │           │     └── Cliente nega → escala para admin
  │           └── Se não reembolsar → cliente pode escalar para admin
  └── Cancela sem pagamento → cancelamento normal

APÓS ACEITAR (com pagamento confirmado):
  - Fornecedor NÃO pode cancelar (botão removido)
  - Só admin pode mudar status

APÓS ENVIAR:
  - Ninguém pode cancelar (só admin)
```

### Mudanças técnicas

**1. Migração SQL**
- Adicionar colunas `cancel_reason` (text) e `refund_state` (text, default 'none') na tabela `negotiations`
  - refund_state: `none` | `pending` | `supplier_confirmed` | `buyer_confirmed` | `buyer_denied`
- Atualizar trigger `validate_negotiation_status_transition`:
  - **Bloquear cancelamento do fornecedor** quando `payment_state = 'confirmed_by_supplier'` (aceito + pago = sem volta)
  - **Bloquear cancelamento** após `shipped` para qualquer um
  - Exigir `cancel_reason` preenchido quando fornecedor cancela com `payment_state = 'reported_by_buyer'`

**2. NegotiationForm.tsx (cliente)**
- Adicionar campo de upload de comprovante e referência de pagamento diretamente no formulário de criação
- Ao submeter: fazer upload para bucket `payment-proofs`, salvar URL, setar `payment_state = 'reported_by_buyer'` junto com a criação
- Remover necessidade de reportar pagamento separadamente (o botão "Já paguei" fica como fallback caso não tenha enviado no registro)

**3. Negociacoes.tsx (fornecedor)**
- Quando `payment_state = 'reported_by_buyer'` e status `pending`:
  - Mostrar comprovante do cliente
  - Botão "Confirmar pagamento + Aceitar" (seta accepted + confirmed_by_supplier)
  - Botão "Negar" → abre dialog com seleção de motivo:
    - "Comprovante falso" → cria disputa automática para admin com foto do comprovante
    - "Outro motivo" → seta `refund_state = 'pending'`, cancela, e fornecedor é obrigado a reembolsar
- Quando `payment_state = 'confirmed_by_supplier'` (pagamento confirmado):
  - **Remover botão de cancelar** completamente
- Quando status = `shipped`:
  - **Remover botão de cancelar** completamente
- Mostrar estado do reembolso quando `refund_state = 'pending'`:
  - Botão "Já reembolsei" → seta `refund_state = 'supplier_confirmed'`

**4. MinhasNegociacoes.tsx (cliente)**
- Quando `refund_state = 'supplier_confirmed'`:
  - Mostrar banner "O fornecedor informou que reembolsou. Você recebeu?"
  - Botão "Sim, recebi" → seta `refund_state = 'buyer_confirmed'`
  - Botão "Não recebi" → seta `refund_state = 'buyer_denied'`, cria disputa automática para admin

**5. Disputas.tsx (admin)**
- Mostrar `cancel_reason` e `refund_state` nos detalhes da disputa
- Admin já pode forçar qualquer status (RPC existente)
- Adicionar ação "Retomar negociação" (admin volta status para `pending` dando prazo ao fornecedor)

### Arquivos modificados

| Arquivo | Mudança |
|---------|---------|
| Migração SQL | Colunas `cancel_reason`, `refund_state`; trigger atualizado |
| `src/components/chat/NegotiationForm.tsx` | Upload de comprovante no registro |
| `src/hooks/useNegotiations.tsx` | Incluir `refund_state` e `cancel_reason` na interface |
| `src/pages/fornecedor/Negociacoes.tsx` | Novo fluxo de aceitar/negar com motivo; remover cancel após confirmação/envio; reembolso |
| `src/pages/cliente/MinhasNegociacoes.tsx` | Confirmação de reembolso; ajuste no fluxo de pagamento |
| `src/pages/admin/Disputas.tsx` | Mostrar dados de reembolso; ação "retomar" |

### Resultado
- Comprovante enviado junto com a negociação desde o início
- Fornecedor não consegue cancelar após confirmar pagamento ou enviar
- Cancelamento com pagamento exige motivo e gera reembolso obrigatório ou disputa
- Fluxo de reembolso bilateral com confirmação do cliente
- Admin tem controle total para resolver qualquer situação

