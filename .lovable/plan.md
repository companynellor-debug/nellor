

# Plan: B2B Wholesale Restructuring

## Current State
- `products` table lacks B2B fields (brand, material, dimensions, sale_unit, min_order_quantity, etc.)
- `product_variations` table exists with basic columns (color, color_hex, size, stock, price, image_url) but lacks variation_type/variation_label/variation_value
- No `product_price_tiers` table exists
- Supplier form is a simple modal; client product page has basic variation support

## Database Changes (1 migration)

**ALTER `products`** — add columns:
- `brand text`, `material text`, `weight_grams int`, `width_cm numeric`, `height_cm numeric`, `depth_cm numeric`
- `condition text default 'new'` (check: 'new','used')
- `ncm_code text`
- `sale_unit text default 'unit'` (check: 'unit','pair','kit','closed_box','bale')
- `units_per_sale_unit int default 1`
- `min_order_quantity int default 1`
- `is_cnpj_only boolean default false`
- `is_international boolean default false`

**CREATE `product_price_tiers`**:
- `id uuid PK`, `product_id uuid FK→products`, `min_quantity int`, `max_quantity int nullable`, `price_per_unit numeric`
- RLS: suppliers can CRUD their own product tiers, authenticated can SELECT

**ALTER `product_variations`** — add columns:
- `variation_type text default 'size'` (check: 'size','numbering','memory','volume','custom')
- `variation_label text` (e.g., "Tamanho", "Numeração")
- `variation_value text` (replaces semantic use of `size` column; keep `size` for backward compat)
- Rename usage: `color` → used as color_name, `image_url` → color_image_url conceptually (no rename needed, just code adaptation)

## Frontend Changes

### 1. Supplier Product Form (`Produtos.tsx`) — Full Rewrite of Modal
Replace the single-section modal with 6 collapsible sections:

**Section 1 — Basic Info**: Name*, Category*, Description* (min 100 chars counter), Brand*, Condition (New/Used), Material*, Origin (National/International)

**Section 2 — Sale Unit**: Dropdown (Unidade/Par/Kit/Caixa Fechada/Fardo). Conditional "units per package" field. Min order quantity* field.

**Section 3 — Price Tiers**: Dynamic list of tiers with min_qty, max_qty, price_per_unit. Live preview table. At least 1 tier required.

**Section 4 — Stock & Logistics**: Weight (g), Dimensions (W×H×D cm), NCM with mask, CNPJ-only toggle.

**Section 5 — Variations**: Toggle to enable. Step A: Add colors with name + photo upload. Step B: Choose variation type dropdown + enter values. Step C: Grid (colors × variations) with stock + optional price per cell.

**Section 6 — Images**: Min 3, max 10 general photos.

### 2. Hook Updates
- **`useSupplierProducts.tsx`**: Extend `SupplierProduct` interface with new fields. Update `addProduct`/`updateProduct` to persist new columns.
- **New `useProductPriceTiers.tsx`**: CRUD hook for `product_price_tiers` table.
- **`useProductVariations.tsx`**: Update to support `variation_type`, `variation_label`, `variation_value`.
- **`VariationsEditor.tsx`**: Add variation type dropdown, relabel "Tamanhos" to dynamic label, support all 5 types.

### 3. Client Product Page (`ProdutoDetalhes.tsx`)
- **Gallery**: Color thumbnails swap main image (existing, enhance)
- **Color selector**: Buttons with mini photo + name, purple border on selected
- **Secondary variation selector**: Buttons showing variation_value, strikethrough + disabled if stock=0
- **Price tier table**: Show all tiers, highlight the one matching current quantity
- **Sale unit badge**: "Vendido por: Caixa com 12 unidades"
- **Bulk order grid**: Enhance `BulkOrderGrid.tsx` to use price tiers (price changes based on total qty), show applied tier, total pieces, total value, min order alert
- **Product details table**: Brand, material, weight, dimensions, condition, origin, NCM

### 4. Cart (`Carrinho.tsx`)
- Show color image per item, color name, variation value, qty, unit price from applied tier, subtotal
- Footer: total pieces + total value

### 5. Supplier Orders (`Pedidos.tsx`)
- Order detail modal: grid with color photo, color name, variation, qty, unit price, subtotal per line
- Footer: total pieces + total value

## Execution Order
1. Database migration (products columns + price_tiers table + variations columns)
2. New hook `useProductPriceTiers`
3. Update `useProductVariations` + `VariationsEditor`
4. Rewrite supplier product form (6 sections)
5. Update `useSupplierProducts` for new fields
6. Update client `ProdutoDetalhes` + `BulkOrderGrid`
7. Update `Carrinho` and supplier `Pedidos`

## File Impact
- **New**: `src/hooks/useProductPriceTiers.tsx`
- **Heavy edit**: `src/pages/fornecedor/Produtos.tsx`, `src/pages/cliente/ProdutoDetalhes.tsx`, `src/components/cliente/BulkOrderGrid.tsx`
- **Medium edit**: `src/hooks/useSupplierProducts.tsx`, `src/hooks/useProductVariations.tsx`, `src/components/fornecedor/VariationsEditor.tsx`, `src/pages/cliente/Carrinho.tsx`, `src/pages/fornecedor/Pedidos.tsx`
- **Migration**: 1 SQL migration file

