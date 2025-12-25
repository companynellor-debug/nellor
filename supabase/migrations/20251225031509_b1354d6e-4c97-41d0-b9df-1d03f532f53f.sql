-- Add human-readable status label columns (keeps existing enums intact)
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS status_label TEXT,
ADD COLUMN IF NOT EXISTS payment_status_label TEXT;

-- Backfill defaults for existing rows (safe, non-breaking)
UPDATE public.orders
SET 
  status_label = COALESCE(status_label, CASE WHEN payment_status = 'paid' THEN 'PAGO' WHEN payment_status = 'cancelled' THEN 'CANCELADO' ELSE 'PENDENTE' END),
  payment_status_label = COALESCE(payment_status_label, CASE WHEN payment_status = 'paid' THEN 'CONFIRMADO' WHEN payment_status = 'cancelled' THEN 'CANCELADO' ELSE 'AGUARDANDO_PAGAMENTO' END)
WHERE status_label IS NULL OR payment_status_label IS NULL;