

## Redesign dos Cards Financeiros - Mantendo Fundo Claro

Os cards atuais usam bolinhas coloridas genéricas. A melhoria é trocar pelos `DarkGlassIcon` e refinar o layout dos cards, sem mudar o fundo da página nem dos cards.

### Mudanças

**1. Financeiro.tsx - Stats Cards (Entregues, Em Trânsito, Pendentes)**
- Remover as bolinhas coloridas (`bg-green-100`, `bg-orange-100`, `bg-yellow-100`)
- Usar `DarkGlassIcon` com os mesmos ícones (CheckCircle, Package, Clock)
- Remover cores nos valores (text-green-600, text-orange-600, text-yellow-600) → usar `text-foreground` padrão
- Manter card branco com `shadow-md` e `rounded-2xl`

**2. Financeiro.tsx - Histórico de Negociações**
- Já usa `DarkGlassIcon` com Handshake - manter como está

**3. Estatisticas.tsx - Cards de métricas**
- Já usa `DarkGlassIcon` - manter como está
- Verificar se há inconsistências visuais

### Arquivos editados
- `src/pages/fornecedor/Financeiro.tsx` - substituir bolinhas coloridas por DarkGlassIcon, unificar cores dos valores

