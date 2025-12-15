import { supabase } from "@/integrations/supabase/client";

/**
 * Busca todos os registros de uma tabela usando paginação por range (evita limite padrão de 1000 do PostgREST).
 *
 * Observação: usamos casts para "any" porque o cliente do Supabase é tipado por tabela.
 */
export async function fetchAllRows<T = any>(opts: {
  table: string;
  select: string;
  pageSize?: number;
  build?: (q: any) => any;
}): Promise<T[]> {
  const pageSize = opts.pageSize ?? 1000;
  let from = 0;
  const all: T[] = [];

  while (true) {
    let q = (supabase as any).from(opts.table).select(opts.select);
    if (opts.build) q = opts.build(q);

    const { data, error } = await q.range(from, from + pageSize - 1);
    if (error) throw error;

    const chunk = (data ?? []) as T[];
    all.push(...chunk);

    if (chunk.length < pageSize) break;
    from += pageSize;
  }

  return all;
}
