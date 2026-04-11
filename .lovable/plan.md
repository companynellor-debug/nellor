

## Plan: Redesign do Perfil de Loja (PerfilLoja.tsx)

### Overview

Complete visual overhaul of `src/pages/cliente/PerfilLoja.tsx` inspired by the reference images, using only real data available in the system. No new database changes needed.

### Available Real Data
- `storeProfile.nome`, `descricao_loja`, `foto_perfil_url`, `banner_loja_url`
- `averageRating`, `storeReviews.length`
- `storeProducts` (array with `nome`, `preco`, `imagens`, `rating_medio`)
- `isStoreFavorite`, `user` (auth state)
- `VerifiedSupplierBadge` component (existing)

### Changes (single file: `src/pages/cliente/PerfilLoja.tsx`)

**1. Hero Banner with Overlay (Mobile)**
- Banner fills top area (~220px) with dark gradient overlay (`bg-gradient-to-t from-black/70 via-black/30 to-transparent`)
- Store avatar (ring-4 ring-white, h-20 w-20) positioned bottom-left over banner
- Store name, rating stars, review count rendered in white text over the overlay
- Back button and Share button as translucent circular icons over the banner (no separate header bar)
- Remove the current sticky white header entirely

**2. Hero Banner (Desktop, lg+)**
- Banner taller (~280px), same gradient overlay
- Avatar larger (h-28 w-28), name and rating text larger
- Content stays inside a max-w-6xl container

**3. Stats Strip Card**
- Floating card (`-mt-6`, `rounded-2xl`, `shadow-lg`, `mx-4`) below the banner
- Row of 3 metrics: `Star icon + averageRating`, `Package icon + storeProducts.length produtos`, `MessageCircle icon + storeReviews.length avaliações`
- Clean horizontal dividers between metrics
- VerifiedSupplierBadge shown here if verified

**4. Tabs Redesign**
- 3 tabs: Produtos, Avaliações, Sobre
- Custom styled tabs with icons (Package, Star, Info)
- Active tab has purple bottom border indicator (not the default shadcn pill style)
- Smooth transition between tabs

**5. Product Grid Enhancement**
- Mobile: 2 columns, `gap-3`
- Desktop (lg+): 3-4 columns
- Cards: `rounded-2xl`, larger image area (`aspect-[4/5]`), hover scale effect
- Product name `font-semibold text-sm line-clamp-2`
- Price in `text-primary font-bold text-base`
- Rating shown with small star + number

**6. "Sobre" Tab (New)**
- Shows `descricao_loja` in a clean card
- ReportButton moved here

**7. Fixed Bottom Action Bar (Mobile)**
- Fixed bar above BottomNav (`bottom-16`) with glassmorphism background
- Two buttons side by side:
  - "Falar com vendedor" (primary, icon MessageCircle, flex-1)
  - "Seguir" heart icon button (outline, toggles favorite)
- Desktop: these buttons appear in the stats card area instead

**8. Reviews Tab**
- Keep existing `ReviewsList` component (already well-designed)
- Remove the wrapping Card, let ReviewsList render directly

### Files Modified
| File | Change |
|------|--------|
| `src/pages/cliente/PerfilLoja.tsx` | Full rewrite of JSX/layout |

### Not Changed
- No new hooks, no database changes, no new components
- BottomNav, ReviewsList, ReportButton stay as-is
- No fake badges ("Mais vendido", "Promoção") added

