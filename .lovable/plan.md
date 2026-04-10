

## Correção: Cotações não seguem para Negociação

### Problema Identificado
Quando o comprador clica "Aceitar e Negociar", o `useAcceptProposal` tenta:
1. Atualizar a proposta aceita (`status = 'accepted'`) na tabela `quotation_proposals`
2. Rejeitar as demais propostas (`status = 'rejected'`)
3. Fechar a cotação (`status = 'closed'`)
4. Criar uma negociação na tabela `negotiations`

O passo 1 e 2 falham silenciosamente porque a política RLS de UPDATE em `quotation_proposals` só permite que o **fornecedor** atualize suas próprias propostas. O **comprador** não tem permissão de UPDATE, mesmo sendo dono da cotação.

### Solução

**1. Nova migração SQL** -- Adicionar política RLS permitindo que o comprador (dono da cotação) atualize o status das propostas:

```sql
CREATE POLICY "Buyers can update proposals on their quotations"
  ON public.quotation_proposals FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.quotation_requests qr
    WHERE qr.id = request_id AND qr.buyer_id = auth.uid()
  ));
```

**2. Melhorar tratamento de erros no frontend** (`useQuotations.tsx`):
- Adicionar `onError` ao `useAcceptProposal` para exibir toast de erro caso algo falhe
- Garantir que o `onSuccess` com `navigate` funcione corretamente

### Arquivos modificados
1. **Nova migração SQL**: política RLS para buyers atualizarem propostas
2. `src/hooks/useQuotations.tsx`: adicionar tratamento de erro no `useAcceptProposal`

