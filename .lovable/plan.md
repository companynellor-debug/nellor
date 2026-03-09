

# Plan: Multiple Fixes and Features

This plan covers 6 areas: folder sharing fix, product form UI polish, sponsorship system overhaul, supplier onboarding tour, store preview real data, and admin sponsorship panel.

---

## 1. Fix Folder (Pasta) Sharing

**Problem**: The `share_token` on collections is never generated. When a user clicks "Compartilhar", `getShareUrl` uses `share_token` but it's null.

**Fix**: In `useCollections.tsx`, update `handleShare` flow in `CollectionsTab.tsx` — when sharing, if `share_token` is null, generate one (UUID) and update the collection row, then copy the URL. Also ensure the `is_public` flag is set to true.

---

## 2. Product Form UI Polish

**Problem**: The product modal form looks basic with plain collapsible sections.

**Changes to `src/pages/fornecedor/Produtos.tsx`**:
- Redesign `SectionHeader` with gradient accent, better spacing, icons with colored backgrounds
- Add subtle card-like borders to each collapsible section
- Improve label styling with helper text
- Add visual separators between form groups
- Make the dialog wider on desktop (`max-w-3xl`) with a cleaner header
- Add step numbers with purple circles
- Better image upload grid with drag-hover effects

---

## 3. Sponsorship System Overhaul

### 3a. Database Migration
Create `sponsorship_requests` table:
```sql
CREATE TYPE sponsorship_type AS ENUM ('produto_destaque', 'banner_homepage');
CREATE TYPE sponsorship_status AS ENUM ('pending', 'approved', 'rejected', 'scheduled');

CREATE TABLE sponsorship_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type sponsorship_type NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  banner_image_url TEXT,
  message TEXT,
  status sponsorship_status DEFAULT 'pending',
  admin_response TEXT,
  scheduled_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE sponsorship_requests ENABLE ROW LEVEL SECURITY;
-- Suppliers can read their own, insert their own
-- Admin access via edge function or service role
```

### 3b. Supplier Patrocinio Page Rewrite (`src/pages/fornecedor/Patrocinio.tsx`)
- Replace current form: add `type` selector (produto_destaque vs banner_homepage)
- Conditionally show product dropdown or banner upload (max 2MB validation)
- Add message field
- Save to `sponsorship_requests` table (not `sponsored_products`)
- Show history with status badges, admin response when available

### 3c. Admin Patrocínios Page (new `src/pages/admin/Patrocinios.tsx`)
- New dedicated admin page with list of all sponsorship requests
- Show supplier name (join profiles), type, banner preview, message
- Action buttons: Aprovar, Rejeitar, Agendar
- Approve: optional scheduled_date + response text
- Reject: required reason field
- On action: update status + insert notification for supplier
- Add route `/admin/patrocinios` in App.tsx
- Add "Patrocínios" menu item with Megaphone icon in AdminSidebar

### 3d. Marketplace Integration
- On homepage, query `sponsorship_requests` where `type='banner_homepage'` AND `status='approved'` AND `scheduled_date <= today` to show sponsored banners
- On product cards, check if product has an approved `produto_destaque` sponsorship → show "Patrocinado" badge

---

## 4. Supplier Onboarding Tour

### 4a. Database
The `profiles` table likely already has `onboarding_completed`. Add `onboarding_tour_completed` (boolean, default false) and `onboarding_tour_step` (integer, default 0) columns via migration.

### 4b. Tour Component (`src/components/fornecedor/OnboardingTour.tsx`)
Build a custom spotlight system (no external dependency needed):
- Full-screen dark overlay with CSS `clip-path` or `box-shadow` to create spotlight hole
- Tooltip/balloon positioned relative to highlighted element using `getBoundingClientRect()`
- Progress bar showing "Passo X de 8" with purple fill
- Buttons: "Anterior", "Próximo", "Pular Tour"
- 8 steps as described, with navigation between pages using `useNavigate()`
- Steps 1 and 8 are centered modals without spotlight

### 4c. Integration in FornecedorLayout
- After dashboard loads, check `onboarding_tour_completed === false`
- After 1 second delay, render `<OnboardingTour />`
- On completion or skip, update `onboarding_tour_completed = true` in profiles

### 4d. "Ver tutorial novamente" Link
- Add small link at bottom of `SupplierSidebar.tsx` that triggers tour restart via a context/state

---

## 5. Store Preview Real Data

**Problem**: In `EditarLoja.tsx` preview tab, `storeStats.totalSales` reads `(p as any).vendas_count` which doesn't exist on products.

**Fix**: Query actual order counts from Supabase for the supplier's products. In the preview tab, fetch real data:
- Count completed orders for supplier's products
- Use real review data (already fetched via `useSupabaseReviews`)
- Show actual product count

---

## 6. Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/fornecedor/OnboardingTour.tsx` | Create — full tour component |
| `src/pages/fornecedor/Patrocinio.tsx` | Rewrite — new sponsorship form with types |
| `src/pages/admin/Patrocinios.tsx` | Create — admin sponsorship management |
| `src/components/admin/AdminSidebar.tsx` | Add Patrocínios menu item |
| `src/App.tsx` | Add admin/patrocinios route |
| `src/pages/fornecedor/Produtos.tsx` | UI polish for product form |
| `src/pages/fornecedor/EditarLoja.tsx` | Fix preview real data |
| `src/pages/fornecedor/FornecedorLayout.tsx` | Add tour trigger |
| `src/components/fornecedor/SupplierSidebar.tsx` | Add "Ver tutorial" link |
| `src/components/cliente/CollectionsTab.tsx` | Fix share token generation |
| `src/hooks/useCollections.tsx` | Add share token generation logic |
| Database migration | `sponsorship_requests` table + tour columns |

---

## Execution Order
1. Database migration (sponsorship_requests table + tour columns)
2. Fix folder sharing (quick fix in useCollections)
3. Product form UI polish
4. Store preview real data fix
5. Sponsorship system (supplier page + admin page + routes)
6. Onboarding tour component + integration

