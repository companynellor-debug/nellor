
## Plano: Assinaturas funcional + Dashboard com Faturamento e Visitas

### Problema 1: Admin não consegue aprovar assinaturas
A função `admin_confirm_subscription` é SECURITY DEFINER e funciona (já há 1 assinatura aprovada no banco). O problema provável é que o `onError` mostra um toast genérico sem detalhes. Vou adicionar logging do erro real e verificar se o admin `user?.id` está disponível no momento da chamada. Também vou garantir que o erro seja exibido com detalhes para facilitar debug.

### Problema 2: Card de Faturamento no Dashboard
Calcular faturamento a partir das negociações com `status = 'delivered'` (soma de `agreed_price * quantity`).

### Problema 3: Rastreamento de Visitas em Produtos (100% funcional)
Precisa de uma nova tabela `product_views` no banco para armazenar cada visualização.

---

### Etapa 1 — Migração SQL

**Nova tabela `product_views`:**
```sql
CREATE TABLE public.product_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  viewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  visitor_fingerprint text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_views_product_id ON product_views(product_id);
CREATE INDEX idx_product_views_created_at ON product_views(created_at);
```

**RLS:** Permitir INSERT para qualquer pessoa (anon + authenticated) e SELECT para o fornecedor dono do produto.

**Função RPC** `get_supplier_product_views(_supplier_id uuid)` — retorna total de views agrupado por produto para o fornecedor.

### Etapa 2 — Frontend: ProdutoDetalhes.tsx
Ao carregar a página de detalhe do produto, fazer `INSERT` na tabela `product_views` com `product_id` e `viewer_id` (se logado).

### Etapa 3 — Frontend: Dashboard.tsx
- Adicionar card **"Faturamento"** calculando soma de `agreed_price * quantity` das negociações `delivered`.
- Adicionar card **"Visitas"** buscando total de views via RPC `get_supplier_product_views`.
- Manter os cards existentes (Negociações pendentes, Avaliações, Produtos).

### Etapa 4 — Admin Assinaturas: Debug e correção
- Adicionar detalhes do erro no toast `onError` para diagnosticar.
- Adicionar fallback: se o RPC falhar, tentar via edge function com adminToken (padrão usado em outras ações admin).
- Log do erro no console para facilitar debug.

### Arquivos editados
- **Migração SQL**: nova tabela, RLS, função RPC
- `src/pages/cliente/ProdutoDetalhes.tsx` — inserir view ao carregar
- `src/pages/fornecedor/Dashboard.tsx` — cards Faturamento + Visitas
- `src/pages/admin/Assinaturas.tsx` — melhorar tratamento de erro
