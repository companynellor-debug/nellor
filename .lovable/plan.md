

## Adaptacao Geral ao Modelo de Negociacao + Conteudo Informativo

Sao 6 frentes de trabalho:

---

### 1. Remover aba de Cupons do painel fornecedor

- **SupplierSidebar.tsx**: Remover item "Cupons" do array `menuItems`
- **BottomNav.tsx (fornecedor)**: Remover "Cupons" do `moreNavItems` e remover import/uso do `useSupplierCoupons`
- **App.tsx**: Remover rotas `/fornecedor/cupons` e `/fornecedor/cupons/relatorio` e seus lazy imports

---

### 2. Adaptar Onboarding do fornecedor (remover referencia a financeiro)

- **Onboarding.tsx**: No step de boas-vindas (step 0), substituir os cards:
  - Remover "Financeiro - Acompanhe suas vendas e receitas"
  - Substituir por cards relevantes ao modelo de negociacao: "Negociacoes - Receba e gerencie propostas de clientes", "Avaliacao - Construa sua reputacao na plataforma"
  - Manter: Produtos, Dashboard, Chat, Notificacoes
- Ajustar texto do step final de "pronta para vender" para "pronta para receber negociacoes"

---

### 3. Adaptar Tutorial interativo (OnboardingTour) ao modelo de negociacao

- **OnboardingTour.tsx**: Atualizar os TOUR_STEPS:
  - Remover step de "Faixas de Preco" (id 6, referencia a DollarSign)
  - Atualizar descricoes para mencionar negociacoes ao inves de vendas
  - Step do Dashboard: "Acompanha suas negociacoes, conversas e desempenho"
  - Step final: "Aguardar as primeiras negociacoes" ao inves de "pedidos"

---

### 4. Tela de Login (Auth.tsx) - Adicionar informacoes da plataforma

- Adicionar um banner/secao acima do formulario com:
  - Frase de impacto: "O marketplace atacadista que conecta voce aos melhores fornecedores"
  - 3-4 palavras-chave visuais em badges/chips: "Fornecedores Verificados", "Negociacao Direta", "Atacado com Seguranca", "Sem Intermediarios"
- Manter o layout glassmorphism existente, apenas expandir a area do header roxo para incluir essas informacoes
- Mobile: badges empilhados em 2 colunas; Desktop: linha unica

---

### 5. Aba "Como Usar" para fornecedores

- **Criar nova pagina**: `src/pages/fornecedor/ComoUsar.tsx`
- Layout em cards/accordion com guia visual passo a passo cobrindo:
  1. Como cadastrar produtos corretamente (fotos, descricoes, variacoes)
  2. Como negociar pelo chat (responder rapido, fazer contra-propostas)
  3. Tecnicas para conseguir mais clientes (perfil completo, fotos de qualidade, precos competitivos)
  4. Como funciona o sistema de avaliacao (importancia, como receber boas avaliacoes)
  5. Como configurar frete (regioes, valores, prazos)
- Cada topico com icone, titulo, e descricao expandivel
- **SupplierSidebar.tsx**: Adicionar item "Como Usar" com icone HelpCircle (substituir o link "Ver tutorial novamente" por este item no menu principal)
- **BottomNav.tsx (fornecedor)**: Adicionar "Como Usar" no menu "Mais"
- **App.tsx**: Adicionar rota `/fornecedor/como-usar`

---

### 6. Secao informativa no Perfil do cliente

- **Perfil.tsx**: Adicionar uma nova secao/card no final da pagina (antes do botao de logout) com:
  - Titulo: "Como funciona a Nellor?"
  - Cards informativos com icones explicando:
    1. Encontre produtos - Navegue pelo marketplace e encontre fornecedores
    2. Negocie direto - Inicie uma conversa e negocie preco e quantidade
    3. Feche o negocio - Combine pagamento e entrega diretamente com o fornecedor
    4. Avalie - Deixe sua avaliacao para ajudar outros compradores
  - Botao "Ver tutorial" que redireciona para uma visao guiada ou abre um modal explicativo

---

### Detalhes Tecnicos

**Arquivos editados:**
- `src/components/fornecedor/SupplierSidebar.tsx` - remover Cupons, adicionar Como Usar
- `src/components/fornecedor/BottomNav.tsx` - remover Cupons, adicionar Como Usar
- `src/App.tsx` - remover rotas de cupons, adicionar rota como-usar
- `src/pages/fornecedor/Onboarding.tsx` - adaptar cards ao modelo negociacao
- `src/components/fornecedor/OnboardingTour.tsx` - atualizar steps
- `src/pages/Auth.tsx` - adicionar banner informativo
- `src/pages/cliente/Perfil.tsx` - adicionar secao "Como funciona"

**Arquivo criado:**
- `src/pages/fornecedor/ComoUsar.tsx` - pagina de guia para fornecedores

