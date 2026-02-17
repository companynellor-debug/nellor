
# Plano: Correção Completa de Bugs e Melhorias do Marketplace Nellor

## Diagnóstico dos Problemas

### 1. Tela Branca ao Criar Produto (Fornecedor)
**Causa:** O hook `useSupplierCategories('current')` é chamado com a string `'current'` em vez do ID real do usuário. O hook faz uma query com `supplier_id = 'current'` e falha silenciosamente, mas o erro pode causar tela branca no `FornecedorLayout` se houver algum problema de renderização. Além disso, o `DialogContent` do modal de produto está sem scroll, causando overflow em telas menores.

### 2. Login de Fornecedor Não Funciona
**Causa:** O `FornecedorLayout` tem um `useEffect` que redireciona para `/fornecedor/onboarding` se `onboarding_completed` for `false`. Usuários existentes que não completaram o flag `onboarding_completed` ficam presos em loop.

### 3. Patrocínio Não Chega ao Admin
**Causa:** A página `admin/Alertas.tsx` só busca notificações gerais, não tem integração com a tabela `sponsored_products`. É preciso adicionar uma seção de patrocínios pendentes no painel admin.

### 4. Botão Denunciar Muito Pequeno e Não Funcional
**Causa:** O componente `ReportButton` usa um `<button>` inline muito pequeno com `text-xs`. Precisa ser expandido para um botão visível com ícone maior.

### 5. Sistema de Compartilhamento de Loja para Fornecedores
**Causa:** O `EditarLoja.tsx` não tem a seção de link copiável da loja. Foi implementado apenas no lado do cliente.

### 6. Configuração de Pedido Mínimo Não Funcional
**Causa:** O `useStoreProfile.tsx` não salva `minOrderQuantity` e `minOrderValue` no banco — o `updateStoreProfile` só salva nome, bio, avatar, banner, telefone e pix_key. Os campos min_order não existem na tabela `profiles`.

### 7. Chave PIX na Edição de Loja
**Causa:** Campo `pixKey` presente no `EditarLoja.tsx` e `useStoreProfile.tsx` — deve ser removido da UI.

### 8. Patrocínio Sem Opção de Banner
**Causa:** O modal de patrocínio em `Patrocinio.tsx` não tem campo de upload de banner/imagem.

### 9. Status dos Pedidos Não Funcional para Clientes
**Causa:** Os filtros de "A Pagar", "A Enviar", "A Receber" em `Perfil.tsx` navegam para `/cliente/meus-pedidos` sem passar o filtro. O `MeusPedidos.tsx` não lê parâmetros de query para pré-selecionar aba/filtro.

### 10. Filtros "A Pagar", "A Enviar", "A Receber" Sem Filtro Aplicado
**Causa:** Os botões em `Perfil.tsx` todos navegam para `/cliente/meus-pedidos` sem nenhum query param. A página `MeusPedidos.tsx` não implementa filtragem por status de pagamento pendente, etc.

---

## Solução Técnica por Arquivo

### Fase 1 — Banco de Dados (Migração)
Adicionar colunas `min_order_quantity` e `min_order_value` à tabela `profiles`.

### Fase 2 — Correções Críticas

#### `src/hooks/useSupplierCategories.tsx`
- O hook aceita `supplierId?: string`, mas em `Produtos.tsx` passa `'current'`
- Corrigir para buscar o user atual quando `supplierId === 'current'`

#### `src/pages/fornecedor/Produtos.tsx`
- Trocar `useSupplierCategories('current')` para usar `useSupabaseAuth()` e passar o `user?.id`
- Adicionar `overflow-y-auto max-h-[85vh]` no `DialogContent` para evitar overflow

#### `src/pages/fornecedor/FornecedorLayout.tsx`
- O redirect para onboarding deve checar `!profile?.onboarding_completed` apenas se `profile` já foi carregado e `loading === false`
- Evitar redirect em loop adicionando verificação de `profile` loaded

#### `src/hooks/useStoreProfile.tsx`
- Adicionar `min_order_quantity` e `min_order_value` no fetch e update
- Remover `pixKey` do tipo `StoreProfile` e das operações (ou manter sem salvar)

#### `src/pages/fornecedor/EditarLoja.tsx`
- Remover o campo "Chave Pix" do formulário
- Fazer o campo "Valor Mínimo do Pedido" usar `CurrencyInput` em vez de `Input type="number"`
- Adicionar seção "Link da Sua Loja" com URL copiável e botão de compartilhar no WhatsApp

#### `src/pages/fornecedor/Patrocinio.tsx`
- Adicionar campo de upload de imagem (banner) no modal de solicitação
- Salvar `banner_url` no insert

#### `src/components/ReportButton.tsx`
- Transformar o botão minúsculo em um botão `variant="outline"` com ícone maior e texto legível

#### `src/pages/cliente/Perfil.tsx`
- Os botões "A Pagar", "A Enviar", "A Receber" devem navegar com query params:
  - A Pagar: `/cliente/meus-pedidos?filtro=a-pagar`
  - A Enviar: `/cliente/meus-pedidos?filtro=a-enviar`
  - A Receber: `/cliente/meus-pedidos?filtro=a-receber`
- Corrigir o filtro `toShip` que usa `order_status === "confirmed"` — o status real é `"preparing"`

#### `src/pages/cliente/MeusPedidos.tsx`
- Ler `searchParams.get("filtro")` para saber qual filtro aplicar
- Implementar uma aba/filtro adicional baseado no query param:
  - `a-pagar`: filtrar orders com `payment_status === 'pending'`
  - `a-enviar`: filtrar orders com `order_status === 'preparing'`
  - `a-receber`: filtrar orders com `order_status === 'shipped'`
- Quando há um filtro ativo, mostrar uma aba extra "Filtrado" ou usar `defaultValue` baseado no param
- Adicionar estado `activeFilter` que controla quais pedidos mostrar

#### `src/pages/admin/Alertas.tsx`
- Adicionar seção "Solicitações de Patrocínio" buscando `sponsored_products` com `status === 'pending'`
- Adicionar botões para aprovar/rejeitar diretamente
- Adicionar seção "Denúncias Recentes" buscando a tabela `reports`

---

## Arquivos a Modificar

| Arquivo | Tipo de Mudança |
|---------|----------------|
| `src/hooks/useSupplierCategories.tsx` | Fix supplierId 'current' |
| `src/pages/fornecedor/Produtos.tsx` | Fix user ID + scroll no modal |
| `src/pages/fornecedor/FornecedorLayout.tsx` | Fix redirect loop no onboarding |
| `src/hooks/useStoreProfile.tsx` | Adicionar min_order, remover pixKey |
| `src/pages/fornecedor/EditarLoja.tsx` | Remover PIX, link copiável, CurrencyInput |
| `src/pages/fornecedor/Patrocinio.tsx` | Campo de banner no modal |
| `src/components/ReportButton.tsx` | Botão maior e mais visível |
| `src/pages/cliente/Perfil.tsx` | Query params nos botões de pedido |
| `src/pages/cliente/MeusPedidos.tsx` | Filtro por query param |
| `src/pages/admin/Alertas.tsx` | Patrocínios e denúncias pendentes |

## Migração de Banco
Uma migração adicionando as colunas `min_order_quantity` (integer) e `min_order_value` (numeric) à tabela `profiles`.

## Ordem de Execução
1. Migração de banco
2. Fix `useStoreProfile` (hooks base)
3. Fix `useSupplierCategories` + `Produtos.tsx` (evitar tela branca)
4. Fix `FornecedorLayout` (loop de onboarding)
5. Fix `EditarLoja` (remover PIX, link loja, campos corretos)
6. Fix `Patrocinio` (banner no modal)
7. Fix `ReportButton` (botão maior)
8. Fix `Perfil` cliente (query params filtros)
9. Fix `MeusPedidos` (ler filtros e aplicar)
10. Fix `admin/Alertas` (patrocínios + denúncias)
