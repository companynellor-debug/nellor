import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SupplierResult {
  id: string;
  nome: string;
  foto_perfil_url: string | null;
}

interface SearchSuppliersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectSupplier: (supplierId: string) => void;
}

export const SearchSuppliersSheet = ({ open, onOpenChange, onSelectSupplier }: SearchSuppliersSheetProps) => {
  const [search, setSearch] = useState('');
  const [suppliers, setSuppliers] = useState<SupplierResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetchSuppliers();
  }, [open]);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.rpc('get_public_store_profiles');
      setSuppliers((data as any[]) || []);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = suppliers.filter(s =>
    s.nome?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>Buscar Fornecedor</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar fornecedores..."
              className="pl-9 rounded-full bg-muted border-0"
            />
          </div>

          <div className="overflow-y-auto max-h-[60vh] space-y-1">
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Carregando...</p>
            ) : filtered.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhum fornecedor encontrado</p>
            ) : (
              filtered.map(supplier => (
                <button
                  key={supplier.id}
                  onClick={() => {
                    onSelectSupplier(supplier.id);
                    onOpenChange(false);
                    setSearch('');
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors"
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                    {supplier.foto_perfil_url ? (
                      <img src={supplier.foto_perfil_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg">
                        {supplier.nome?.charAt(0) || '?'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold">{supplier.nome}</p>
                    <p className="text-xs text-muted-foreground">Fornecedor</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
