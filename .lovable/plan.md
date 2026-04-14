

## Plan: Fix Chat, Remove Leftover Feature References, and Clean Database Data

### Problems Identified

1. **Chat broken**: The conversation list in `Chat.tsx` is missing its rendering code -- after the search bar there's nothing before `<BottomNav />`. The `filteredConversations` are computed but never rendered.

2. **Removed features still linked in UI** (clicking them causes 404):
   - **Home.tsx**: "Painel de Cotações" CTA card + "Comparar" button on suppliers section
   - **Perfil.tsx**: "Minhas Cotações", "Comparar Fornecedores", "Programa de Afiliados" menu items + "Serviços Nellor" section (Afiliados + Prestador)
   - **SupplierSidebar.tsx**: "Cotações" and "Patrocínio" menu items
   - **AdminSidebar.tsx**: "Afiliados & Prestadores" and "Patrocínios" menu items
   - **Ajuda.tsx**: Tutorial cards and FAQ entries about Cotações and Comparar Fornecedores
   - **ClientOnboardingTour.tsx**: Tour steps about Cotações and Comparar Fornecedores
   - **Permissoes.tsx**: References afiliados/prestadores (page itself is ComingSoon but route exists)
   - **PublicProduto.tsx**: Affiliate tracking param cleanup code
   - **Auth.tsx**: Service provider ref localStorage code

3. **Database over quota** (238MB / 500MB, egress at 135%):
   - `notifications`: 493,823 rows = 139MB (biggest table)
   - `orders`: 223 rows = 35MB
   - `messages`: 96 rows = 1MB
   - Other tables with test data: `activity_logs`, `reviews`, `login_attempts`, etc.

### Actions

#### 1. Fix Chat conversation list rendering
- Add back the conversation list JSX between search bar and BottomNav in `Chat.tsx`
- Render `filteredConversations` with supplier name, last message preview, timestamp, unread badge

#### 2. Remove dead feature references from UI

**Home.tsx**: Remove "Cotações CTA" card (lines 187-199) and "Comparar" button from suppliers section (line 293-295)

**Perfil.tsx**: Remove "Minhas Cotações", "Comparar Fornecedores", "Programa de Afiliados" from menu. Remove entire "Serviços Nellor" section (Afiliados + Prestador)

**SupplierSidebar.tsx**: Remove "Cotações" and "Patrocínio" menu items

**AdminSidebar.tsx**: Remove "Afiliados & Prestadores" and "Patrocínios" menu items

**Ajuda.tsx**: Remove tutorial cards and FAQ items about Cotações and Comparar Fornecedores

**ClientOnboardingTour.tsx**: Remove tour steps for Cotações and Comparar Fornecedores, update final step text

**Auth.tsx**: Remove service provider ref code

**PublicProduto.tsx**: Remove affiliate tracking param code

#### 3. Database data cleanup (migration)
Truncate data from active tables to free space:
- `TRUNCATE notifications` (139MB, 493K rows of test data)
- `TRUNCATE orders` (35MB)  
- `TRUNCATE messages` (1MB)
- `TRUNCATE activity_logs, analytics, login_attempts, notification_sent_events, phone_verification_codes, reports, reviews, disputes`
- `TRUNCATE collections, collection_items, collection_members`
- `TRUNCATE negotiations, product_views, price_history`
- Keep table structures intact, just remove all test data

This should bring database from ~238MB down to under 50MB.

#### 4. Remove unused pages/components
- Delete `src/pages/fornecedor/Permissoes.tsx` (just a ComingSoon wrapper for removed features)
- Remove Permissoes route from App.tsx if still present

### Files Modified
| File | Change |
|------|--------|
| `src/pages/cliente/Chat.tsx` | Restore conversation list rendering |
| `src/pages/cliente/Home.tsx` | Remove Cotações CTA + Comparar button |
| `src/pages/cliente/Perfil.tsx` | Remove dead menu items + Serviços section |
| `src/pages/cliente/Ajuda.tsx` | Remove Cotações/Comparar tutorial + FAQ |
| `src/components/cliente/ClientOnboardingTour.tsx` | Remove 2 tour steps |
| `src/components/fornecedor/SupplierSidebar.tsx` | Remove 2 menu items |
| `src/components/admin/AdminSidebar.tsx` | Remove 2 menu items |
| `src/pages/Auth.tsx` | Remove service provider code |
| `src/pages/PublicProduto.tsx` | Remove affiliate code |
| Migration SQL | TRUNCATE all test data from active tables |

