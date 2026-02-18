
# Plano: 3 Correções Críticas

## Diagnóstico Exato dos Problemas

### 1. Erro ao Excluir Produto — Foreign Key Constraint
**Causa raiz:** A tabela `affiliate_commission_items` tem uma chave estrangeira referenciando `products.id`. Quando o banco tenta deletar o produto fisicamente (`DELETE FROM products WHERE id = ?`), o Postgres rejeita porque há registros de comissão associados a esse produto — é uma proteção de integridade referencial.

**Solução:** Soft delete — ao invés de deletar fisicamente, apenas marcar o produto como `ativo = false`. O produto desaparece do marketplace (a RLS já filtra por `ativo = true`), desaparece da lista do fornecedor (vamos adicionar o filtro no fetch), mas o histórico de comissões permanece íntegro. Mudança em `useSupplierProducts.tsx`.

### 2. Notificações Não Chegando para Fornecedores
**Causa raiz:** A política RLS da tabela `notifications` para INSERT exige `has_role(auth.uid(), 'admin'::app_role)`. Quando um **comprador** finaliza o pedido em `StepStripePayment.tsx` e tenta inserir uma notificação para o fornecedor, ele está autenticado como cliente comum — não como admin. O insert falha silenciosamente (está em try/catch com apenas `console.warn`).

**Solução:** Mover a inserção de notificação no banco para dentro da Edge Function `send-push-notification`, que já usa o `SUPABASE_SERVICE_ROLE_KEY` (admin client que ignora RLS). A função já recebe `user_id`, `title`, `body` — só precisamos adicionar a lógica de INSERT dentro dela. Assim a notificação no banco e o push acontecem juntos de forma confiável.

### 3. Confetti Travando o App
**Causa raiz:** O `triggerConfetti` em `CheckoutSucesso.tsx` usa `setInterval` de 250ms por 3 segundos = 12 ticks × 2 chamadas = **24 calls de confetti** com até 50 partículas cada. Isso cria centenas de elementos DOM de animação simultâneos, saturando o browser e causando o travamento visível.

**Solução:** Substituir o loop de interval por **uma única chamada** de confetti com efeito de spray lateral (origin esquerda + direita) com partículas razoáveis (~80 total). Leve, fluido, visualmente bonito, sem travar.

---

## Implementação Técnica

### `src/hooks/useSupplierProducts.tsx`

**Mudança no `deleteProduct`:** Trocar `.delete()` por `.update({ ativo: false })`.

**Mudança no `fetchProducts`:** Adicionar `.eq('ativo', true)` para não mostrar produtos excluídos na lista do fornecedor.

```tsx
// ANTES
const { error } = await supabase.from('products').delete().eq('id', id);

// DEPOIS (soft delete)
const { error } = await supabase.from('products').update({ ativo: false }).eq('id', id);
```

```tsx
// ANTES no fetchProducts (sem filtro)
.from('products').select('*').eq('supplier_id', user.id)

// DEPOIS
.from('products').select('*').eq('supplier_id', user.id).eq('ativo', true)
```

### `supabase/functions/send-push-notification/index.ts`

Adicionar insert de notificação no banco logo após enviar os pushes, usando o `supabaseAdmin`:

```ts
// Após enviar push, inserir registro no banco para o painel in-app
await supabaseAdmin.from("notifications").insert({
  user_id: user_id,
  title: title,
  body: body,
  type: type || "order_update",
  data: data || null,
  sound: true,
  read: false,
});
```

Também aceitar o campo `data` no body da requisição para passar informações extras (order_id, etc.).

**Em `StepStripePayment.tsx`:** Remover o bloco separado de insert de notificação (que falha por RLS), já que agora a Edge Function cuida disso. Passar o campo `data` junto com o invoke da função.

### `src/pages/cliente/CheckoutSucesso.tsx`

**Substituir** a função `triggerConfetti` com loop de interval por uma chamada simples de burst único:

```tsx
// ANTES: setInterval de 250ms por 3s = 24 calls = trava o app
const triggerConfetti = () => {
  const duration = 3 * 1000;
  const interval = setInterval(...) // 24 calls com 50 partículas cada
};

// DEPOIS: dois bursts únicos = fluido e leve
const triggerConfetti = () => {
  confetti({
    particleCount: 80,
    spread: 100,
    origin: { x: 0.2, y: 0.6 },
    colors: ["#4B0082", "#6A0DAD", "#9370DB", "#DDA0DD", "#22c55e"],
    ticks: 200,
  });
  confetti({
    particleCount: 80,
    spread: 100,
    origin: { x: 0.8, y: 0.6 },
    colors: ["#4B0082", "#6A0DAD", "#9370DB", "#DDA0DD", "#22c55e"],
    ticks: 200,
  });
};
```

---

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useSupplierProducts.tsx` | Soft delete + filtro `ativo=true` no fetch |
| `supabase/functions/send-push-notification/index.ts` | Inserir notificação no banco usando service role |
| `src/components/checkout/StepStripePayment.tsx` | Remover insert manual de notificação (duplicação) |
| `src/pages/cliente/CheckoutSucesso.tsx` | Substituir confetti interval por burst único |

## Ordem de Execução
1. Fix `useSupplierProducts` — soft delete (resolve o erro imediatamente)
2. Fix Edge Function — notificações no banco via service role (resolve o problema raiz)
3. Fix `StepStripePayment` — remover insert duplicado que falha
4. Fix confetti — burst único (resolve o travamento)
