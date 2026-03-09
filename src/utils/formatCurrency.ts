export const formatCurrency = (value: number | string | null | undefined): string => {
  const numeric = typeof value === 'string' ? Number(value) : value ?? 0;
  const safe = Number.isFinite(numeric) ? numeric : 0;

  return safe.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};
