

## Análise e Roteiro de Melhorias para a Nellor

O Google levantou 5 pilares. Vou mapear o que a Nellor **já tem** vs **o que falta** e propor implementações práticas.

---

### O que JÁ EXISTE na Nellor

| Recomendação | Status |
|---|---|
| Selo de Verificação (CNPJ) | Implementado |
| Logs de Negociação (chat auditável) | Implementado |
| Chat/Mensageria | Implementado |
| Sistema de Disputas | Implementado |
| Blacklist (admin bane fornecedores) | Implementado |
| Avaliações/Reputação | Implementado |
| Mensalidade SaaS (R$ 29) | Implementado |
| Publicidade/Destaque (Patrocínios) | Implementado |
| Portal Comprador/Fornecedor/Admin | Implementado |
| Formulário de Negociação no Chat | Implementado |

---

### O que FALTA (ordenado por impacto)

**1. Contrato de Intenção / Resumo do Acordo (PDF)**
Quando uma negociação é aceita, gerar automaticamente um PDF com o resumo (produto, quantidade, preço, prazo, dados das partes). Isso formaliza o acordo e dá segurança jurídica.
- Adicionar botão "Gerar Resumo do Acordo" na negociação com status `accepted`
- Gerar PDF client-side com os dados da negociação
- Salvar no Supabase Storage e permitir download

**2. Mapa Comparativo de Propostas**
Permitir que o comprador compare fornecedores lado a lado para o mesmo tipo de produto.
- Na página de produto ou na lista de interesse, adicionar botão "Comparar"
- Tela simples com tabela comparando preço, avaliação, prazo e localização de até 3 fornecedores

**3. Termos de Uso / Isenção de Responsabilidade**
Página de Termos que define a Nellor como "aproximadora" e isenta de falhas de entrega/pagamento.
- Criar página `/termos-de-uso` com texto jurídico
- Exigir aceite no cadastro (checkbox no signup)

**4. Ocultação de Dados de Contato**
Esconder telefone/email do fornecedor até que o comprador inicie uma negociação formal pelo chat.
- No perfil da loja e nos produtos, ocultar dados diretos
- Mostrar apenas após primeiro contato via chat

**5. Painel de Cotação (RFQ - Request for Quote)**
Comprador posta o que precisa; fornecedores respondem com preço e prazo. Isso é um diferencial forte mas é uma feature grande.
- Criar tabela `quotation_requests` no banco
- Página para comprador criar pedido de cotação
- Notificar fornecedores da categoria relevante
- Fornecedores respondem com proposta

---

### Plano de Implementação (priorizado)

**Fase 1 - Rápido e alto impacto (esta iteração)**

1. **Contrato de Intenção PDF** - Botão nas negociações aceitas que gera PDF com resumo do acordo
2. **Termos de Uso** - Página estática + checkbox obrigatório no cadastro
3. **Ocultação de contato** - Esconder telefone/WhatsApp no perfil da loja até haver conversa

**Fase 2 - Médio prazo**

4. **Mapa Comparativo** - Tela de comparação de fornecedores
5. **RFQ (Cotação)** - Sistema de pedidos de cotação

---

### Detalhes Técnicos - Fase 1

**Contrato PDF:**
- Arquivo: `src/components/cliente/NegotiationContractPDF.tsx` (novo)
- Usar biblioteca `jspdf` para gerar PDF client-side
- Botão adicionado em `MinhasNegociacoes.tsx` e `Negociacoes.tsx` (fornecedor)
- Dados: nomes das partes, produto, quantidade, preço, prazo, data do acordo

**Termos de Uso:**
- Arquivo: `src/pages/TermosDeUso.tsx` (novo)
- Rota: `/termos-de-uso` (pública)
- Checkbox no `Auth.tsx` no formulário de cadastro
- Campo `terms_accepted_at` já existe no banco (tabela affiliates tem exemplo)

**Ocultação de contato:**
- Arquivo: `src/pages/cliente/PerfilLoja.tsx` - condicionar exibição de telefone/email
- Verificar se existe conversa entre o usuário e o fornecedor antes de mostrar dados

