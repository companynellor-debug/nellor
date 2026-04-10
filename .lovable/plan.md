

## Plan: Sistema de Confirmação de Entrega Seguro com Notificações Automáticas

### Problema Atual
- Nenhuma notificação automática quando chega a data prevista de entrega
- Fornecedor pode marcar "shipped" mas o comprador não é notificado para confirmar
- Sem confirmação bilateral real (dupla confirmação) -- qualquer parte pode agir unilateralmente
- Os botões de confirmação só aparecem quando o status é `pending` + data vencida, ignorando o fluxo `shipped`

### Solução

#### 1. Migração de Banco de Dados
Adicionar coluna `supplier_confirmed_delivery` (boolean, default false) na tabela `negotiations` para rastrear confirmação bilateral. Criar um trigger que envia notificações automáticas:

- **Quando fornecedor marca como "shipped"**: notifica o comprador
- **Quando fornecedor marca como "delivered"**: notifica o comprador pedindo confirmação
- **Quando chega a data `expected_delivery`**: uma Edge Function periódica (ou trigger na UI) notifica o comprador perguntando se recebeu

#### 2. Edge Function: `check-delivery-dates`
Função agendada (chamada via cron ou na abertura do app) que:
- Busca negociações com `status IN ('accepted', 'shipped')` e `expected_delivery <= hoje`
- Para cada uma, cria notificação para o comprador: "Sua entrega de [produto] era prevista para hoje. Você recebeu?"
- Marca na negociação um flag `delivery_check_sent` para não repetir

#### 3. Fluxo de Confirmação Bilateral Seguro

```text
pending → accepted → shipped → awaiting_confirmation → delivered
                                      ↓
                                  disputed (se não recebeu)
```

- **Fornecedor marca envio** (`shipped`): `supplier_confirmed_shipping = true`, notifica comprador
- **Fornecedor marca entrega** ou **data chega**: status muda para `shipped` (se ainda não estava), notifica comprador
- **Comprador confirma recebimento**: `buyer_confirmed_delivery = true`, `delivery_confirmed_at = now()`, status → `delivered`
- **Comprador nega recebimento** (após 7 dias): abre disputa automática
- **Só o comprador pode marcar "delivered"** -- fornecedor NÃO pode mudar para delivered sozinho

#### 4. Trigger de Notificação no Banco
Criar `notify_negotiation_changes()` que:
- No UPDATE de `status` para `shipped`: cria notificação para o comprador
- No UPDATE de `supplier_confirmed_delivery` para `true`: cria notificação para o comprador pedindo confirmação

#### 5. Alterações no Frontend

**MinhasNegociacoes.tsx (Cliente)**:
- Mostrar botões "Sim, recebi" e "Não recebi" quando status = `shipped` (não só quando `pending`)
- Quando status = `accepted` e data vencida, mostrar alerta amarelo
- Adicionar banner de destaque para negociações que precisam de ação

**Negociacoes.tsx (Fornecedor)**:
- Remover possibilidade do fornecedor marcar como "delivered" diretamente
- Mostrar claramente que aguarda confirmação do comprador
- Quando `shipped`, mostrar "Aguardando confirmação do comprador"

**useNegotiations.tsx**:
- `confirmDelivery()`: só o comprador pode chamar, seta `buyer_confirmed_delivery = true` e status = `delivered`
- Fornecedor só pode: aceitar, enviar (shipped), cancelar

### Arquivos Modificados
- **Nova migração SQL**: adicionar `supplier_confirmed_delivery`, `delivery_check_sent`, trigger `notify_negotiation_changes`
- **Nova Edge Function**: `check-delivery-dates/index.ts`
- `src/hooks/useNegotiations.tsx` -- separar ações de comprador vs fornecedor
- `src/pages/cliente/MinhasNegociacoes.tsx` -- corrigir fluxo de confirmação
- `src/pages/fornecedor/Negociacoes.tsx` -- remover ação de "delivered" do fornecedor

