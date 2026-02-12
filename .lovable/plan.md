

# Plano: Melhorias Estruturais e Visuais na Plataforma Nellor

## Visao Geral
Este plano cobre 15 frentes de trabalho organizadas em fases para manter o projeto estavel durante a implementacao.

---

## FASE 1 - Infraestrutura Base

### 1.1 Componente de Formatacao Monetaria Global
Criar um utilitario e componente reutilizavel para formatacao BRL.

**Novo arquivo:** `src/utils/currency.ts`
- Funcao `formatCurrency(cents: number): string` que formata centavos para "R$ X,XX"
- Funcao `parseCurrencyInput(raw: string): number` que converte input do usuario para centavos
- Funcao `CurrencyInput` - componente de input monetario com mascara dinamica (2 -> R$ 0,02 / 200 -> R$ 2,00)

**Arquivos afetados:**
- `src/pages/fornecedor/Produtos.tsx` - campo de preco usa CurrencyInput
- `src/pages/cliente/Carrinho.tsx` - exibicao usa formatCurrency
- `src/pages/cliente/Home.tsx` - precos dos produtos
- `src/hooks/useProducts.tsx` - formatacao do price string
- `src/pages/fornecedor/Financeiro.tsx` - valores financeiros
- Todos os campos monetarios da plataforma

### 1.2 Componente de Bloqueio "Em Breve"
**Novo arquivo:** `src/components/ComingSoonOverlay.tsx`
- Icone de cadeado centralizado
- Texto: "Funcionalidade em desenvolvimento. Disponivel em breve."
- Fundo semi-transparente com blur
- Props: `title?: string`, `description?: string`

### 1.3 Remocao do Nellor Drop
- Remover rotas `/drop/*` do `App.tsx`
- Remover imports dos componentes Drop
- Remover link "Nellor Drop" do `SupplierSidebar.tsx`
- Remover opcoes Drop do perfil do cliente (`Perfil.tsx`)
- Remover `ModeSwitcher` e `BottomNav` do Drop
- Manter os arquivos no projeto mas desconectar das rotas

### 1.4 Bloqueio de Funcoes Nao Essenciais
- `ProgramaAfiliados.tsx` - envolver com ComingSoonOverlay
- `AfiliadoCadastro.tsx` - envolver com ComingSoonOverlay
- `PrestadorServicos.tsx` - envolver com ComingSoonOverlay
- Remover links do perfil do cliente para essas funcoes bloqueadas ou adicionar badge "Em breve"

---

## FASE 2 - Sistema de Loja Publica e Compartilhamento

### 2.1 Rota Publica de Loja
**Novo:** Adicionar rota publica `/loja/:id` no `App.tsx` (sem ProtectedRoute)
- Qualquer visitante pode ver produtos, categorias, banner e perfil
- Botoes de "Comprar", "Favoritar" e "Adicionar ao Carrinho" redirecionam para `/auth` se nao logado

**Modificar:** `src/pages/cliente/PerfilLoja.tsx`
- Verificar `user` antes de mostrar botoes de acao
- Se nao logado: mostrar botoes com redirect para login
- Adicionar botao "Compartilhar Loja" com link publico

### 2.2 Compartilhamento de Loja (Fornecedor)
**Modificar:** `src/pages/fornecedor/EditarLoja.tsx`
- Adicionar secao "Link da sua loja" com URL copiavel
- Botao de copiar e compartilhar via WhatsApp
- URL formato: `{domain}/loja/{supplier_id}`

---

## FASE 3 - Categorias Personalizadas do Fornecedor

### 3.1 Migracao de Banco de Dados
**Nova tabela:** `supplier_categories`

```text
id: uuid (PK)
supplier_id: uuid (FK -> auth.users)
nome: text
slug: text
created_at: timestamptz
```

**RLS:** Fornecedores gerenciam suas proprias categorias; todos podem ler.

### 3.2 Hook e UI
**Novo:** `src/hooks/useSupplierCategories.tsx` - CRUD de categorias do fornecedor

**Modificar:** `src/pages/fornecedor/EditarLoja.tsx`
- Substituir sistema de categorias customizadas em localStorage por Supabase
- Categorias salvas na nova tabela `supplier_categories`

**Modificar:** `src/pages/fornecedor/Produtos.tsx`
- No Select de categoria, mostrar categorias do marketplace + categorias proprias do fornecedor

**Modificar:** `src/pages/cliente/PerfilLoja.tsx`
- Exibir filtro por categorias proprias da loja

---

## FASE 4 - Campos Avancados de Produto

### 4.1 Migracao de Banco
Adicionar colunas opcionais na tabela `products`:

```text
tamanhos: jsonb (array de strings, ex: ["P","M","G","GG"] ou ["38","39","40"])
cores: jsonb (array de strings, ex: ["Preto","Branco","Azul"])
is_kit: boolean default false
kit_items: jsonb (array de {nome, quantidade})
```

### 4.2 UI de Cadastro de Produto
**Modificar:** `src/pages/fornecedor/Produtos.tsx`
- Adicionar secao "Variacoes" no modal com:
  - Tamanhos: chips com input livre + presets (P/M/G/GG, numeracao calcados)
  - Cores: chips com input e preview de cor
  - Toggle "Vender em Kit"
  - Se kit: lista de itens do kit (nome + quantidade)
- Todos os campos sao opcionais

**Modificar:** `src/hooks/useSupplierProducts.tsx`
- Mapear novos campos no insert/update

**Modificar:** `src/pages/cliente/ProdutoDetalhes.tsx`
- Exibir seletores de tamanho e cor quando disponivel
- Exibir lista de itens do kit

---

## FASE 5 - Sistema de Denuncia

### 5.1 Migracao de Banco
**Nova tabela:** `reports`

```text
id: uuid (PK)
reporter_id: uuid (FK -> auth.users)
target_type: text ('product' | 'supplier')
target_id: uuid
reason: text
description: text
status: text default 'pending' ('pending','reviewed','resolved')
created_at: timestamptz
```

**RLS:** Usuarios criam denuncias; admins gerenciam todas.

### 5.2 Componente e Integracao
**Novo:** `src/components/ReportButton.tsx`
- Botao discreto "Denunciar" com icone de bandeira
- Modal com select de motivo + campo de descricao
- Submete para tabela `reports`

**Modificar:**
- `src/pages/cliente/ProdutoDetalhes.tsx` - adicionar botao de denuncia
- `src/pages/cliente/PerfilLoja.tsx` - adicionar botao de denuncia na loja

**Admin:** Adicionar secao de denuncias em `AdminAlertas` ou nova pagina

---

## FASE 6 - Estrutura de Reembolso

### 6.1 Migracao de Banco
**Nova tabela:** `refund_requests`

```text
id: uuid (PK)
order_id: uuid (FK -> orders)
buyer_id: uuid
supplier_id: uuid
reason: text default 'not_received'
status: text default 'pending' ('pending','confirmed','approved','rejected')
created_at: timestamptz
confirmed_at: timestamptz
resolved_at: timestamptz
```

**RLS:** Compradores criam e confirmam; fornecedores e admins visualizam.

### 6.2 Fluxo no Frontend
**Modificar:** `src/pages/cliente/MeusPedidos.tsx`
- Adicionar botao "Nao recebi" em pedidos com status "shipped" apos 3 dias
- Criar modal de confirmacao
- Apos confirmacao, criar registro em `refund_requests`
- Criar notificacao para fornecedor e admin

---

## FASE 7 - Sistema de Patrocinio

### 7.1 Migracao de Banco
**Nova tabela:** `sponsored_products`

```text
id: uuid (PK)
product_id: uuid (FK -> products)
supplier_id: uuid
banner_url: text
description: text
status: text default 'pending' ('pending','approved','rejected','expired')
approved_at: timestamptz
expires_at: timestamptz
created_at: timestamptz
```

**RLS:** Fornecedores criam e visualizam; admins gerenciam.

### 7.2 Fornecedor - Aba Patrocinio
**Nova pagina:** `src/pages/fornecedor/Patrocinio.tsx`
- Formulario: selecionar produto, upload de banner, descricao da campanha
- Lista de solicitacoes com status
- Adicionar rota e link no `SupplierSidebar`

### 7.3 Admin - Gestao de Patrocinios
**Adicionar** secao em pagina admin existente ou nova pagina
- Aprovar/rejeitar solicitacoes
- Definir limite de 3 banners diarios
- Gestao de rotacao

### 7.4 Marketplace - Exibicao
**Modificar:** `src/pages/cliente/Home.tsx`
- Secao "Destaques" com produtos patrocinados aprovados
- Rotacao sequencial (nao influencia busca)

---

## FASE 8 - Filtros Avancados

### 8.1 Filtro de Tipo de Cliente (CNPJ/CPF)
**Migracao:** Adicionar coluna `client_type_filter` em `profiles` (tipo text, default 'all', valores: 'all','cnpj_only')

**Modificar:** `src/pages/fornecedor/EditarLoja.tsx` ou `Configuracoes.tsx`
- Toggle: "Vender apenas para CNPJ" / "Vender para todos"

**Modificar:** `src/hooks/useProducts.tsx`
- Filtrar produtos baseado no tipo de documento do cliente logado

### 8.2 Categorias de Origem (Nacional/Internacional)
**Migracao:** Adicionar coluna `origin` em `products` (text, default 'nacional', valores: 'nacional','internacional')

**Modificar:** `src/pages/fornecedor/Produtos.tsx` - campo no cadastro
**Modificar:** `src/pages/cliente/Produtos.tsx` - filtro de origem
**Modificar:** `src/pages/cliente/Home.tsx` - exibir badge de origem

### 8.3 Sistema de Trends
**Nova tabela:** `trend_requests`

```text
id: uuid (PK)
product_id: uuid
supplier_id: uuid
status: text default 'pending'
created_at: timestamptz
approved_at: timestamptz
```

**Fornecedor:** Botao "Solicitar Trend" no produto
**Admin:** Aprovar/rejeitar
**Home:** Secao "Em Alta" com produtos aprovados

---

## FASE 9 - Banner e Personalizacao de Loja

### 9.1 Melhorias na Pagina de Loja Publica
**Modificar:** `src/pages/cliente/PerfilLoja.tsx`
- Layout estilo marketplace moderno (similar Shopee/Mercado Livre)
- Banner hero com overlay gradiente
- Avatar sobreposto ao banner
- Biografia formatada
- Grid de categorias da loja
- Responsividade otimizada

---

## FASE 10 - Perfil do Cliente e Preparacao para Fornecedor

### 10.1 Melhoria do Perfil do Cliente
**Modificar:** `src/pages/cliente/Perfil.tsx`
- Remover links para Drop e funcoes bloqueadas
- Manter secos: Pedidos, Favoritos, Enderecos, Pagamentos, Notificacoes, Suporte
- Adicionar secao "Meus Favoritos" com preview
- Design mais limpo e moderno

### 10.2 Preparacao para Cadastro de Fornecedor (Somente Estrutura)
A tabela `profiles` ja possui campo `tipo` (cliente/fornecedor) e `onboarding_completed`.
A tabela `user_roles` ja existe com roles.

Nenhuma migracao adicional necessaria nesta fase - a estrutura ja suporta o fluxo futuro de cadastro de fornecedor.

---

## Resumo de Novas Tabelas

| Tabela | Proposito |
|--------|-----------|
| `supplier_categories` | Categorias personalizadas por fornecedor |
| `reports` | Denuncias de produtos/fornecedores |
| `refund_requests` | Solicitacoes de reembolso |
| `sponsored_products` | Produtos patrocinados |
| `trend_requests` | Solicitacoes de destaque em Trends |

## Resumo de Novos Arquivos

| Arquivo | Proposito |
|---------|-----------|
| `src/utils/currency.ts` | Formatacao monetaria BRL |
| `src/components/ComingSoonOverlay.tsx` | Overlay "Em breve" |
| `src/components/ReportButton.tsx` | Botao de denuncia |
| `src/hooks/useSupplierCategories.tsx` | CRUD categorias do fornecedor |
| `src/pages/fornecedor/Patrocinio.tsx` | Gestao de patrocinios |

## Ordem de Implementacao

1. Formatacao monetaria global (currency.ts + CurrencyInput)
2. Componente ComingSoonOverlay
3. Remocao do Drop + bloqueio de funcoes
4. Rota publica de loja + compartilhamento
5. Migracoes de banco (todas as tabelas novas)
6. Categorias personalizadas do fornecedor
7. Campos avancados de produto
8. Sistema de denuncia
9. Estrutura de reembolso
10. Sistema de patrocinio
11. Filtros (tipo cliente, origem, trends)
12. Melhorias visuais (perfil loja, perfil cliente)

