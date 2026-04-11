

## Plan: Sistema Completo de Tutorial e Suporte para Clientes

### 1. Migration — Novo campo na tabela `profiles`

Adicionar coluna `client_onboarding_completed` (boolean, default false) na tabela `profiles`. O campo existente `onboarding_completed` é usado pelo fornecedor, então precisamos de um separado para o cliente.

### 2. Novo Componente — Tour Guiado do Cliente

**Arquivo:** `src/components/cliente/ClientOnboardingTour.tsx`

Tour com 9 passos (os 7 originais + cotações + comparar fornecedores):

| Passo | Tipo | Alvo | Navegação |
|-------|------|------|-----------|
| 1 | Modal | — | /cliente |
| 2 | Spotlight | Barra de busca + categorias | /cliente |
| 3 | Spotlight | Card de produto | /cliente |
| 4 | Spotlight | Botão "Negociar" | /cliente/produto/:id |
| 5 | Spotlight | Aba Chat na nav | /cliente/produto/:id |
| 6 | Spotlight | Botão registrar negociação (simulado) | /cliente/chat |
| 7 | Spotlight | Botão Cotações no perfil | /cliente/perfil |
| 8 | Spotlight | Botão Comparar Fornecedores no perfil | /cliente/perfil |
| 9 | Modal | Conclusão | — |

Lógica: overlay escuro com recorte SVG para spotlight, posicionamento do tooltip relativo ao elemento, navegação automática entre rotas, barra de progresso, salvar `client_onboarding_completed = true` ao concluir.

### 3. Context Provider — Tour do Cliente

**Arquivo:** `src/hooks/useClientOnboardingTour.tsx`

Context com `shouldShowTour`, `startTour`, `endTour`, `triggerRestart`. Montado dentro do `ClienteLayout`.

### 4. Auto-iniciar tour na Home

Em `ClienteHome`, verificar `profile.client_onboarding_completed === false` e, após 1 segundo, chamar `startTour()`.

### 5. Nova Página — Ajuda e FAQ

**Arquivo:** `src/pages/cliente/Ajuda.tsx`  
**Rota:** `/cliente/ajuda`

Três seções:
- **Tutorial passo a passo:** 8 cards expansíveis (Encontrar Fornecedores, Negociar pelo Chat, Registrar Negociação, Gerar PDF, Avaliar Fornecedor, Reportar Problema, Cotações, Comparar Fornecedores)
- **FAQ:** Accordion com 20 perguntas organizadas em 5 categorias (Começando, Encontrando Produtos, Negociando, Após a Compra, Segurança)
- **Suporte direto:** Card com fundo roxo escuro + botão WhatsApp

### 6. Botão Flutuante de Suporte

**Arquivo:** `src/components/cliente/FloatingHelpButton.tsx`

Botão circular fixo com `?`, posicionado acima da BottomNav em mobile. Ao clicar, mini menu com 3 opções:
- "Ver Tutorial" → `triggerRestart()` do context
- "Perguntas Frequentes" → navega `/cliente/ajuda`
- "Falar com Suporte" → abre WhatsApp

Animação de pulso nas primeiras 3 visitas (controlado via `localStorage`).

Montado no `ClienteLayout` para aparecer em todas as telas.

### 7. Botão "Ver Tutorial" no Perfil

Em `Perfil.tsx`, adicionar item no menu principal: ícone `Lightbulb`, label "Ver Tutorial Novamente", que chama `triggerRestart()`.

### 8. Registrar rota e lazy import

Em `App.tsx`:
- Adicionar lazy import de `Ajuda`
- Adicionar `<Route path="ajuda" .../>` dentro das rotas `/cliente`

### 9. Atualizar `useSupabaseAuth`

Adicionar `client_onboarding_completed` na interface `Profile` e no `fetchProfile`.

### Arquivos afetados

| Arquivo | Ação |
|---------|------|
| `supabase/migrations/` | Nova migration (add column) |
| `src/hooks/useClientOnboardingTour.tsx` | Criar |
| `src/components/cliente/ClientOnboardingTour.tsx` | Criar |
| `src/components/cliente/FloatingHelpButton.tsx` | Criar |
| `src/pages/cliente/Ajuda.tsx` | Criar |
| `src/pages/cliente/ClienteLayout.tsx` | Adicionar providers + FloatingHelpButton |
| `src/pages/cliente/Home.tsx` | Auto-iniciar tour |
| `src/pages/cliente/Perfil.tsx` | Botão "Ver Tutorial" |
| `src/hooks/useSupabaseAuth.tsx` | Adicionar campo ao Profile |
| `src/App.tsx` | Rota /cliente/ajuda |

