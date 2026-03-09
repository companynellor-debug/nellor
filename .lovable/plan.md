

# Plano: Fixes Admin + Especificações de Produto

## Problemas Identificados

### 1. Admin excluir/banir contas nao funciona
A Edge Function `admin-user-actions` nao esta no `config.toml`. Sem a entrada, o Supabase pode rejeitar requests. Adicionaremos `verify_jwt = false`.

### 2. Patrocinio e Denuncias nao chegam pro admin
Os dados EXISTEM no banco (3 sponsored_products pendentes, 1 report pendente). As politicas RLS estao corretas (admin tem ALL). O problema provavel e que o admin nao esta vendo os dados na aba Alertas. Investigando mais: a query de `notifications` na linha 26 do Alertas.tsx faz `select('*')` sem filtro de user_id -- mas a RLS filtra por `user_id = auth.uid()` automaticamente. Se nao houver notificacoes do admin, retorna vazio. As queries de `sponsored_products` e `reports` tem politica ALL para admin e devem funcionar. Vou adicionar melhor tratamento de erro e logs para debug, e garantir que a aba Alertas mostre os dados mesmo quando notificacoes estao vazias.

### 3. Especificacoes de Produto (Tamanhos, Cores, Kits)
O banco ja tem colunas: `tamanhos` (JSONB), `cores` (JSONB), `is_kit` (boolean), `kit_items` (JSONB). Falta:
- UI no modal de criacao/edicao de produto (Produtos.tsx)
- Mapeamento no useSupplierProducts
- Exibicao no ProdutoDetalhes.tsx para clientes escolherem
- Incluir no CartItem para rastrear selecao

---

## Implementacao

### Arquivo: `supabase/config.toml`
Adicionar entrada para `admin-user-actions`:
```toml
[functions.admin-user-actions]
verify_jwt = false
```

### Arquivo: `supabase/functions/admin-user-actions/index.ts`
Atualizar CORS headers para incluir headers extras que o client envia. Tambem adicionar verificacao de que o chamador e admin (usando service role para verificar user_roles).

### Arquivo: `src/hooks/useSupplierProducts.tsx`
Expandir interface `SupplierProduct` com campos:
```ts
sizes?: string[];        // ["P","M","G","GG"] ou ["38","39","40"]
colors?: string[];       // ["Preto","Branco","Azul"]
isKit?: boolean;
kitItems?: { name: string; quantity: number }[];
```
Mapear `tamanhos`, `cores`, `is_kit`, `kit_items` do banco no fetch. Incluir no insert e update.

### Arquivo: `src/pages/fornecedor/Produtos.tsx`
Adicionar secoes opcionais no modal apos "Limites de Pedido":

**Tamanhos** (opcional):
- Toggle "Este produto tem tamanhos?"
- Chips pre-definidos: P, M, G, GG, XG (para roupas)
- Input livre para adicionar tamanhos customizados (ex: 38, 39, 40 para calcados)
- Cada chip e clicavel para selecionar/deselecionar

**Cores** (opcional):
- Toggle "Este produto tem cores?"
- Input para adicionar cores com botao +
- Chips removiveis para cada cor adicionada

**Kit** (opcional):
- Toggle "Este produto e um kit?"
- Lista de itens do kit com nome e quantidade
- Botao para adicionar item ao kit

### Arquivo: `src/pages/cliente/ProdutoDetalhes.tsx`
Adicionar selecao de tamanho e cor antes do botao "Adicionar ao Carrinho":
- Se o produto tem `tamanhos`: mostrar chips selecionaveis
- Se o produto tem `cores`: mostrar chips selecionaveis
- Se e kit: mostrar lista de itens inclusos
- Validar que tamanho e cor foram selecionados antes de adicionar ao carrinho

### Arquivo: `src/hooks/useCart.tsx`
Expandir `CartItem` com `selectedSize?: string` e `selectedColor?: string` para rastrear a selecao.

### Arquivo: `src/pages/admin/Alertas.tsx`
Melhorar tratamento de erros -- tratar cada query independentemente em vez de Promise.all, para que uma falha nao bloqueie as outras. Adicionar console.log para debug.

---

## Ordem de Execucao
1. Fix config.toml + admin-user-actions (resolve exclusao de contas)
2. Fix Alertas.tsx (garante que sponsorships e reports aparecem)
3. Expandir useSupplierProducts com novos campos
4. Adicionar UI de tamanhos/cores/kit no Produtos.tsx
5. Exibir especificacoes no ProdutoDetalhes.tsx
6. Expandir CartItem com selecao de variacao

