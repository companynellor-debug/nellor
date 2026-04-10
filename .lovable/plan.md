

## Plano: Segurança contra Pagamento Falso + Correção de Comprovantes

### Problemas identificados

1. **Buckets `payment-proofs` e `invoices` são privados**, mas o código usa `getPublicUrl()` que só funciona com buckets públicos. Resultado: ninguém consegue ver os comprovantes nem as NFs.
2. **Fornecedor contesta pagamento** mas não existe escalação para o admin. O fornecedor clica "Não localizei" e a negociação fica travada.
3. **Admin não tem visibilidade** das negociações contestadas, comprovantes, dados do comprador, nem pode forçar cancelamento ou continuidade.

### Mudanças

**1. Corrigir buckets (Migração SQL)**
- Tornar `payment-proofs` e `invoices` públicos (`UPDATE storage.buckets SET public = true`). Isso permite que `getPublicUrl()` funcione e os comprovantes/NFs sejam acessíveis.

**2. Opção "Pagamento Falso" para o fornecedor**
- Na tela `Negociacoes.tsx`, quando o fornecedor contesta, adicionar uma opção clara: `"Alegar comprovante falso"` que seta `payment_state = 'contested_by_supplier'` com motivo padronizado e cria automaticamente uma disputa na tabela `disputes` para o admin analisar.

**3. Painel Admin — Disputas com dados completos**
- Atualizar a RPC `get_admin_disputes` para trazer todos os campos da negociação: `payment_state`, `payment_proof_url`, `payment_reference`, `buyer_data`, `invoice_url`, `quantity`, `payment_method`.
- Na tela `Disputas.tsx`, mostrar:
  - Comprovante do comprador (imagem/link)
  - Referência de pagamento
  - Dados do comprador (NF)
  - Status do pagamento
  - Motivo da contestação
- Admin pode:
  - **Forçar cancelamento** (seta `status = 'cancelled'` na negociação, bypassing triggers via RPC SECURITY DEFINER)
  - **Dar continuidade** (seta `payment_state = 'confirmed_by_supplier'` e resolve a disputa)
  - **Suspender fornecedor** (já existe)

**4. RPC admin para forçar ações na negociação**
- Criar função `admin_resolve_negotiation_dispute(negotiation_id, action, admin_notes)` com SECURITY DEFINER que:
  - Se action = `force_cancel`: cancela a negociação ignorando triggers
  - Se action = `force_continue`: confirma pagamento e resolve disputa
  - Valida que o caller é admin via `has_role`

### Arquivos modificados

| Arquivo | Mudança |
|---------|---------|
| Migração SQL | Buckets públicos, nova RPC admin, atualizar `get_admin_disputes` |
| `src/pages/fornecedor/Negociacoes.tsx` | Opção "comprovante falso" na contestação + criar disputa automática |
| `src/pages/admin/Disputas.tsx` | Mostrar dados completos da negociação + botões forçar cancelamento/continuidade |

### Resultado
- Comprovantes visíveis para fornecedores e admins
- Fornecedor pode escalar "pagamento falso" direto para o admin
- Admin tem visão completa e pode resolver forçando cancelamento ou continuidade
- Proteção bilateral: comprador protegido contra cancelamento indevido, fornecedor protegido contra comprovantes falsos

