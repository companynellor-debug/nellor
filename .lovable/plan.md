

## Análise: O que já existe vs O que falta (Recomendações do Google)

### JÁ IMPLEMENTADO na Nellor

| Funcionalidade | Status | Onde |
|---|---|---|
| Chat/Mensageria com histórico | ✅ | Chat.tsx / ChatFornecedor.tsx |
| Botão "Formalizar Acordo" (Negociação no chat) | ✅ | NegotiationForm.tsx |
| Contrato PDF (Resumo do Acordo) | ✅ | NegotiationContractPDF.tsx |
| Diretório de Fornecedores (Vitrine) | ✅ | Home.tsx / PerfilLoja.tsx |
| Selo de Verificação (CNPJ) | ✅ | VerificationForm.tsx |
| Avaliações/Reputação | ✅ | ReviewsList.tsx / useReviews |
| Mapa Comparativo (até 3 fornecedores) | ✅ | CompararFornecedores.tsx |
| Notificações em Tempo Real | ✅ | Push + in-app |
| Status da Negociação (tags) | ✅ | MinhasNegociacoes.tsx |
| Termos de Uso | ✅ | TermosDeUso.tsx |
| Dashboard do Fornecedor | ✅ | Dashboard.tsx |
| Documentação/Compliance (upload docs) | ✅ | VerificationForm.tsx |
| Ocultação de contato | ✅ | PerfilLoja.tsx |

### O QUE FALTA (ordenado por impacto)

**1. Painel de Cotações (RFQ) — O recurso mais importante que falta**
Comprador publica o que precisa → Fornecedores respondem com preço e prazo. Isso diferencia a Nellor do WhatsApp.

**2. Avaliação 360° — Fornecedor avalia o comprador**
Atualmente só o comprador avalia. Fornecedor precisa avaliar se o comprador foi sério.

**3. Medidor de Tempo de Resposta**
Exibir no perfil do fornecedor o tempo médio de resposta a cotações/mensagens.

**4. Exportação de "Relatório de Escolha" PDF**
PDF comparativo para o financeiro do comprador justificar a escolha do fornecedor X.

**5. Botão "Preciso de ajuda" — Chat com admin**
Canal direto com o dono da plataforma para quem não encontra o que precisa.

---

### Plano de Implementação — Fase 1 (RFQ + melhorias rápidas)

**1. Sistema de Cotações (RFQ)**
- Criar tabela `quotation_requests` (buyer_id, title, description, quantity, specs_file_url, category_id, deadline, status)
- Criar tabela `quotation_proposals` (request_id, supplier_id, unit_price, freight, offer_validity, notes, status)
- Página `/cliente/cotacoes` — listar cotações do comprador + botão "Nova Cotação"
- Página `/fornecedor/cotacoes` — listar cotações abertas da categoria + botão "Enviar Proposta"
- Vista comparativa das propostas recebidas (reutilizar estilo do CompararFornecedores)
- Adicionar link nas BottomNav ou no Perfil

**2. Avaliação 360° (fornecedor avalia comprador)**
- Adicionar campo `reviewer_type` (buyer/supplier) na tabela reviews ou criar tabela `buyer_reviews`
- No painel do fornecedor, após negociação entregue, botão "Avaliar Comprador"
- No perfil do comprador, exibir nota média recebida dos fornecedores

**3. Tempo Médio de Resposta**
- Calcular com base nos timestamps de mensagens no chat
- Exibir badge "Responde em ~Xh" no perfil da loja

**4. Botão "Preciso de ajuda"**
- Botão flutuante na Home do cliente que abre o chat de suporte (já existe a página Suporte.tsx)
- Redirecionar para `/cliente/suporte`

### Arquivos a criar/editar

**Novos:**
- `supabase/migrations/xxx_create_quotation_tables.sql` — tabelas RFQ
- `src/pages/cliente/Cotacoes.tsx` — painel de cotações do comprador
- `src/pages/fornecedor/Cotacoes.tsx` — painel de cotações do fornecedor
- `src/hooks/useQuotations.tsx` — hook para gerenciar cotações

**Editados:**
- `src/App.tsx` — novas rotas
- `src/components/cliente/BottomNav.tsx` ou `src/pages/cliente/Perfil.tsx` — link para cotações
- `src/components/fornecedor/SupplierSidebar.tsx` — link para cotações
- `src/pages/cliente/Home.tsx` — botão "Preciso de ajuda"

