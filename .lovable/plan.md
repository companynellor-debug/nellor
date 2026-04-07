

# Plano: Redesign Visual da Nellor (Inspirado nas Referências)

## Resumo

Atualização visual em 4 áreas principais, mantendo a identidade Nellor mas trazendo um visual mais moderno, arredondado e polido.

---

## 1. Home do Cliente — Visual mais arredondado e moderno

**Arquivo**: `src/pages/cliente/Home.tsx`

### Banners
- Aumentar border-radius para `rounded-2xl` ou `rounded-3xl`
- Adicionar sombra suave nos banners (`shadow-lg`)
- Adicionar indicadores de paginação (dots) abaixo do carousel

### Categorias (estilo foto 1)
- Transformar em pills/chips horizontais com ícone + texto lado a lado (estilo `All Products | Swimming | Goggles`)
- Background colorido na categoria ativa (bg-primary text-white), outline nas demais
- Scroll horizontal suave com `snap-x`

### Cards de Produto
- Aumentar arredondamento para `rounded-2xl`
- Imagem com `rounded-xl` interno
- Preço com badge colorido sobreposto na imagem (canto inferior esquerdo, estilo foto 1)
- Sombra suave (`shadow-md`) e hover mais pronunciado
- Rating e vendidos com layout mais limpo

---

## 2. Página de Detalhes do Produto — Estilo limpo e redondo (foto 2)

**Arquivo**: `src/pages/cliente/ProdutoDetalhes.tsx`

- Imagem principal com `rounded-3xl` e sem bordas duras
- Thumbnails laterais menores e mais arredondados (`rounded-xl`)
- Seção de tamanhos com botões pill arredondados (`rounded-full`, border quando selecionado)
- Seletor de quantidade com botões `-` e `+` estilo minimalista com bordas arredondadas
- Preço em destaque maior e mais limpo
- Botão "Negociar" full-width com `rounded-2xl` e fundo escuro (estilo "Add to Bag" da foto 2)
- Badges (Novo, Nacional, Garantia) com estilo mais pill (`rounded-full`)

---

## 3. Financeiro do Fornecedor — Estilo premium com destaque (foto 3)

**Arquivo**: `src/pages/fornecedor/Financeiro.tsx`

- Hero card no topo com gradiente primário (roxo) mostrando o **Total Negociado** em fonte grande e branca (estilo "Total spending $145,900")
- Filtros abaixo do hero como pills/tabs arredondados (`Entregues | Em Trânsito | Pendentes`) com estilo Starter/Medium/Expert da foto 3
- Cards de resumo abaixo com visual mais limpo, ícones maiores e arredondados
- Lista de negociações recentes com layout tipo "transações" (data, nome, valor alinhado à direita)

---

## 4. Dashboard do Fornecedor — Cards visuais premium (foto 4)

**Arquivo**: `src/pages/fornecedor/Dashboard.tsx`

- Cards de estatísticas com gradiente escuro ou colorido (estilo foto 4: "Total Products 345" com fundo azul/escuro)
- Layout 2x2 no mobile com cards mais compactos mas visualmente ricos
- Ícones maiores dentro dos cards com background circular
- Barra de busca arredondada no topo (decorativa, link para produtos)
- Seção "Stock Overview" / resumo rápido com indicadores coloridos inline
- Cards de negociações recentes com visual mais limpo tipo lista

---

## Detalhes técnicos

- Apenas mudanças de CSS/Tailwind e reestruturação de JSX — sem mudanças de lógica ou banco
- Manter todas as funcionalidades existentes intactas
- Usar as cores do tema atual (primary = roxo, etc.)
- Todos os componentes continuam responsivos (mobile-first)
- 4 arquivos editados, nenhum arquivo novo

