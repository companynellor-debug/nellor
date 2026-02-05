
# Plano: Substituição Total do Stripe pelo Asaas

## Resumo
Remover **completamente** todas as referências ao Stripe do projeto e implementar um novo sistema de verificação de identidade e pagamentos estilo Kiwify, adaptado para o Asaas (sem mencionar Asaas no frontend).

---

## Escopo da Remoção

### Arquivos a EXCLUIR (Edge Functions Stripe)
```text
supabase/functions/stripe-check-account/
supabase/functions/stripe-connect-onboarding/
supabase/functions/stripe-create-payment/
supabase/functions/stripe-get-balance/
supabase/functions/stripe-reconcile-orders/
supabase/functions/stripe-verify-payment/
supabase/functions/stripe-webhook/
```

### Arquivos a EXCLUIR (Hooks Stripe)
```text
src/hooks/useStripeConnect.tsx
src/hooks/useAutoStripeRevalidation.ts
```

### Arquivos a REFATORAR (Remover referências Stripe)

| Arquivo | O que remover |
|---------|---------------|
| `src/pages/fornecedor/Financeiro.tsx` | Remover fetch de `stripe-get-balance`, textos "Stripe", interface `StripeBalance` |
| `src/pages/fornecedor/Recebimentos.tsx` | Remover verificação `stripe_account_id`, textos "Stripe", cálculos de taxa Stripe |
| `src/pages/fornecedor/Planos.tsx` | Remover todos os textos "Stripe", atualizar exemplos |
| `src/pages/fornecedor/Pedidos.tsx` | Já limpo anteriormente |
| `src/pages/fornecedor/Dashboard.tsx` | Verificar referências restantes |
| `src/pages/cliente/MeusPedidos.tsx` | Remover chamada `stripe-verify-payment` |
| `src/pages/cliente/CheckoutSucesso.tsx` | Remover verificação Stripe |
| `src/pages/admin/Financeiro.tsx` | Remover textos "Stripe", estatísticas `stripeConnected` |
| `src/pages/admin/Reconciliacao.tsx` | Remover página inteira (depende 100% do Stripe) |
| `src/components/admin/AdminSidebar.tsx` | Remover link "Reconciliação" |
| `src/components/fornecedor/FeeTransparency.tsx` | Atualizar textos removendo Stripe |
| `src/hooks/useAdminPrefetch.tsx` | Remover campo `stripe_account_id` |
| `supabase/config.toml` | Remover configurações das functions Stripe |

---

## Novo Sistema de Verificação de Identidade (Estilo Kiwify)

### Hook `useIdentityVerification` (já existe, será aprimorado)
Campos coletados:
- Nome completo
- CPF ou CNPJ
- Data de nascimento
- Endereço completo
- Chave Pix (para recebimentos)
- Dados bancários (banco, agência, conta)

Status:
- `unverified` → Não pode vender nem sacar
- `review` → Documentos enviados, aguardando análise
- `verified` → Liberado para vender e sacar

### Novo Componente `VerificationForm.tsx`
Formulário completo estilo Kiwify com:
- Validação de CPF/CNPJ
- Máscara de inputs
- Upload de documento (placeholder para backend)
- Feedback visual de progresso

### Novo Sistema Financeiro do Fornecedor

**Página Financeiro refatorada:**
- Cards: Saldo Disponível | Saldo a Receber | Total Vendido
- Botão "Solicitar Saque" (bloqueado se não verificado)
- Histórico de movimentações (vendas, saques)
- Aba de Verificação de Identidade
- Sem menção a "Stripe" ou "Asaas"

**Cálculo de taxas:**
- Comissão Nellor: 7,5% (plano Grátis) ou 0% (Premium)
- Taxa do gateway: ~3,49% (genérico, sem mencionar processador)
- Exemplo: Venda R$100 → Taxa 7,5% + 3,49% = R$10,99 → Líquido R$89,01

---

## Bloqueios de Segurança

### Regras de Bloqueio
Usuários com `status !== 'verified'` terão:

1. **Botão "Vender" desabilitado** em Produtos
2. **Botão "Solicitar Saque" desabilitado** em Financeiro
3. **Mensagens claras** explicando por que estão bloqueados
4. **Banner persistente** incentivando verificação

### Componente `VerificationStatusBanner` (já existe, será ajustado)
- Exibe status atual
- Link direto para completar verificação
- Cores: vermelho (bloqueado) / amarelo (em análise) / verde (ok)

---

## Mudanças no Admin

### Remover
- Página "Reconciliação" (era 100% Stripe)
- Estatísticas "Fornecedores com Stripe"
- Textos sobre "Stripe Connect"

### Adicionar/Atualizar
- Estatística "Fornecedores Verificados" (substituindo stripeConnected)
- Textos genéricos sobre "processador de pagamentos"

---

## Mudanças no Checkout do Cliente

### StepStripePayment → StepPagamento
- Remover qualquer chamada a edge functions Stripe
- UI genérica de "Pagamento" (Pix, Cartão - placeholders)
- Texto: "Processando pagamento seguro..."

### MeusPedidos
- Remover chamada `stripe-verify-payment`
- Status de pagamento atualizado via realtime do Supabase

---

## Estrutura de Arquivos Final

### Novos arquivos
```text
src/components/fornecedor/VerificationForm.tsx
src/components/fornecedor/WithdrawalModal.tsx
src/components/fornecedor/FinancialSummaryCards.tsx
src/components/fornecedor/MovementsHistory.tsx
```

### Arquivos mantidos (refatorados)
```text
src/hooks/useIdentityVerification.ts (aprimorado)
src/components/fornecedor/VerificationStatusBanner.tsx (atualizado)
src/pages/fornecedor/Financeiro.tsx (reescrito sem Stripe)
```

---

## Ordem de Implementação

1. **Excluir edge functions Stripe** (7 pastas)
2. **Excluir hooks Stripe** (2 arquivos)
3. **Atualizar config.toml** (remover entries Stripe)
4. **Remover página Reconciliação** + link no sidebar
5. **Refatorar Financeiro.tsx** do fornecedor
6. **Refatorar Recebimentos.tsx** do fornecedor
7. **Refatorar Planos.tsx** (textos)
8. **Refatorar FeeTransparency.tsx** (textos)
9. **Refatorar admin/Financeiro.tsx** (textos e stats)
10. **Refatorar cliente/MeusPedidos.tsx** (remover stripe-verify)
11. **Refatorar checkout** (StepStripePayment → StepPagamento)
12. **Criar componentes novos** (VerificationForm, WithdrawalModal)
13. **Aplicar bloqueios visuais** em telas-chave

---

## Notas Técnicas

- **Sem backend ainda**: Toda lógica de verificação/saque usa `localStorage` como placeholder
- **Linguagem simples**: Sem termos técnicos (API, webhook, gateway)
- **Visual Kiwify**: Cards coloridos, badges de status, fluxo passo a passo
- **Sem mencionar Asaas**: Frontend totalmente genérico
