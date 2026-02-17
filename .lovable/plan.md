
# Plano: Correções Críticas e Melhorias da Plataforma Nellor

## Diagnóstico Completo dos Problemas

### 1. Verificação de Identidade Bloqueando Produtos no Marketplace
O hook `useIdentityVerification` usa `localStorage` para armazenar o status. A tela do Dashboard mostra `canSell` dependendo desse valor, mas os produtos já são exibidos publicamente pela RLS (`ativo = true` é viewable by everyone). O problema real é que o Dashboard exibe um aviso de verificação que pode confundir e não é necessário para testes. A solução é desabilitar a verificação de identidade temporariamente.

### 2. Tela Branca ao Adicionar Produto
O componente `Produtos.tsx` importa e usa `useSupplierCategories(user?.id)` — correto. Mas o problema persiste. Analisando o código, a causa raiz é que no `SelectContent` há dois `<SelectItem value="" disabled>` com value vazio `""` que geram erro React no Radix Select (valor duplicado ou inválido). Isso causa crash no componente.

### 3. Sem Campo de Foto no Cadastro de Produto
O código atual em `Produtos.tsx` tem o estado `imageFiles` e função `handleImageUpload`, mas a **seção de upload de imagens está ausente no JSX do modal** — o formulário mostra Nome, Categoria, Descrição, Preço/Estoque, mas não exibe o input de upload de imagem.

### 4. Filtro de Datas no Painel do Fornecedor
A página `Pedidos.tsx` tem filtro de status mas não tem filtro de datas. Precisamos adicionar um DatePicker (usando Shadcn Calendar/Popover) para filtrar pedidos por período.

### 5. Estatísticas Incorretas na Pré-visualização da Loja
`EditarLoja.tsx` define `storeStats` como valores zerados hardcoded e `reviews` como array vazio. Precisamos buscar dados reais do Supabase usando `useSupabaseReviews` passando os IDs dos produtos do fornecedor, e buscar o `vendas_count` dos produtos.

### 6. Notificações Admin Lentas/Não Funcionais
O `useAdminNotifications` faz uma query pesada e o sistema de realtime tem um canal que pode causar latência. Simplificaremos o fetch e tornaremos o dropdown mais responsivo.

### 7. Aba "Afiliados e Prestadores" Erro 444 / Remove da Conta
A página `AffiliatePrestadores.tsx` usa RPCs como `get_admin_affiliates`, `get_admin_service_providers` etc., que provavelmente não existem ou retornam erros 404/444. A solução é envolver a página com o `ComingSoonOverlay` igual às outras funcionalidades suspensas.

### 8. Aba "Nellor Drop" no Admin Deve Ser "Em Breve"
`NellorDrop.tsx` no admin usa `useAdminDrop()` que chama RPCs de drop (`get_drop_admin_stats`, `get_drop_suppliers_admin`, etc.) que provavelmente falham. Deve ser envolvido com `ComingSoonOverlay`.

### 9. Banners no Painel Admin Não Otimizados
- Para clientes: remover `CarouselPrevious`, `CarouselNext` e o overlay de título/subtítulo nos banners
- Para admin: verificar o fluxo de criação (a função `admin-banners` com Edge Function)

---

## Solução por Arquivo

### `src/hooks/useIdentityVerification.ts`
Alterar `canSell` para retornar sempre `true` enquanto aguarda implementação real. Isso remove o bloqueio de testes.

### `src/pages/fornecedor/Produtos.tsx`
**Dois fixes:**
1. Corrigir os `<SelectItem value="">` duplicados — usar `value="__disabled__"` ou remover esses itens separadores inválidos (causa da tela branca no Radix Select)
2. Adicionar a seção de upload de imagens no JSX do modal (o campo existe na lógica mas não no visual)

### `src/pages/fornecedor/Pedidos.tsx`
Adicionar filtro de datas com DatePicker (Popover + Calendar shadcn) ao lado do filtro de status existente. Filtrar `filteredOrders` pelo período selecionado.

### `src/pages/fornecedor/EditarLoja.tsx`
Na aba de **Pré-visualização**, substituir os valores zerados hardcoded por dados reais:
- Importar `useSupabaseReviews` sem filtro e filtrar pelos produtos do fornecedor
- Calcular `averageRating` e `totalReviews` a partir dos dados reais
- Calcular `totalSales` somando `vendas_count` dos produtos

### `src/pages/admin/AffiliatePrestadores.tsx`
Envolver todo o conteúdo com `ComingSoonOverlay` em vez de fazer queries que causam erro 444. Título: "Afiliados e Prestadores" / Descrição: "Sistema de afiliados e prestadores de serviços em desenvolvimento."

### `src/pages/admin/NellorDrop.tsx`
Envolver com `ComingSoonOverlay`. Título: "Nellor Drop" / Descrição: "O programa Drop está temporariamente suspenso e em reestruturação."

### `src/pages/cliente/Home.tsx`
Remover `<CarouselPrevious>` e `<CarouselNext>` do carousel de banners. Remover o overlay com `banner.title` e `banner.subtitle` de cada item de banner.

### `src/components/ComingSoonOverlay.tsx`
Verificar se suporta uso standalone (sem precisar envolver children) para usar nas páginas admin.

---

## Detalhes Técnicos de Implementação

### Fix Tela Branca — Radix Select (CRÍTICO)
O Radix Select UI lança erro quando há múltiplos `SelectItem` com `value=""`. No `Produtos.tsx` linhas 201 e 209:
```tsx
<SelectItem value="" disabled>Categorias do Sistema</SelectItem>
...
<SelectItem value="" disabled>Minhas Categorias</SelectItem>
```
Ambos têm `value=""` — isso cria conflito interno no Radix. Deve-se substituir por `SelectLabel` do Radix (`@/components/ui/select`) que é feito especificamente para isso sem precisar de value.

### Fix Upload de Imagens no Modal
O formulário em `Produtos.tsx` tem `imageFiles` no estado e `handleImageUpload`, mas o JSX do modal não inclui a seção visual. Adicionaremos após o campo de descrição:
- Label "Fotos do Produto *"
- Grid de previews das imagens
- Botão de upload com `<input type="file" multiple accept="image/*">`
- Limite de 5 imagens com botão X para remover

### Fix Estatísticas Reais na Pré-visualização
Em `EditarLoja.tsx`, o estado de `storeStats` e `reviews` são hardcoded. Adicionaremos:
```tsx
const { reviews: allReviews } = useSupabaseReviews(); // sem filtro
const storeProductIds = products.map(p => p.id);
const storeReviews = allReviews.filter(r => storeProductIds.includes(r.product_id));
const averageRating = storeReviews.length > 0 
  ? storeReviews.reduce((s, r) => s + r.rating, 0) / storeReviews.length 
  : 0;
const totalSales = products.reduce((s, p) => s + (p.stock || 0), 0); // usar vendas_count quando disponível
```

### Fix Admin Notificações
Simplificar `useAdminNotifications.tsx`:
- Reduzir a frequência de cache TTL para 1 minuto
- Garantir que o componente `AdminNotificationDropdown` carrega imediatamente com estado vazio (sem loading blocker)

### Fix DatePicker em Pedidos
Adicionar dois DatePickers (data inicial e final) usando Shadcn Popover + Calendar com `pointer-events-auto`.

---

## Arquivos a Modificar

| Arquivo | Tipo de Mudança |
|---------|----------------|
| `src/hooks/useIdentityVerification.ts` | canSell = true temporariamente |
| `src/pages/fornecedor/Produtos.tsx` | Fix SelectItem + adicionar campo foto |
| `src/pages/fornecedor/Pedidos.tsx` | Adicionar filtro de datas |
| `src/pages/fornecedor/EditarLoja.tsx` | Buscar stats reais na pré-visualização |
| `src/pages/admin/AffiliatePrestadores.tsx` | Envolver com ComingSoonOverlay |
| `src/pages/admin/NellorDrop.tsx` | Envolver com ComingSoonOverlay |
| `src/pages/cliente/Home.tsx` | Remover setas e texto dos banners |
| `src/hooks/useAdminNotifications.tsx` | Otimizar cache/fetch |

## Ordem de Implementação
1. Fix crítico: `useIdentityVerification` (canSell = true)
2. Fix crítico: `Produtos.tsx` (SelectItem vazio + campo foto)
3. Fix: Admin `AffiliatePrestadores` + `NellorDrop` com ComingSoonOverlay
4. Fix: `EditarLoja.tsx` stats reais
5. Fix: `Home.tsx` banner sem setas/texto
6. Melhoria: `Pedidos.tsx` filtro de datas
7. Otimização: `useAdminNotifications` cache
