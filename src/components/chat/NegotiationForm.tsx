import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNegotiations } from '@/hooks/useNegotiations';

interface NegotiationFormProps {
  supplierId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SupplierProduct {
  id: string;
  nome: string;
  preco: number;
}

const paymentMethodOptions = [
  { value: 'pix', label: 'PIX' },
  { value: 'transferencia', label: 'Transferência bancária' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'outro', label: 'Outro' },
];

export const NegotiationForm = ({ supplierId, open, onOpenChange }: NegotiationFormProps) => {
  const { createNegotiation } = useNegotiations(supplierId);
  const [products, setProducts] = useState<SupplierProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [agreedPrice, setAgreedPrice] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const resetForm = () => {
    setSelectedProductId('');
    setProductName('');
    setQuantity(1);
    setAgreedPrice('');
    setPaymentMethod('pix');
    setExpectedDelivery('');
    setNotes('');
  };

  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    const product = products.find(p => p.id === productId);
    if (product) {
      setProductName(product.nome);
      setAgreedPrice(String(product.preco));
    }
  };

  useEffect(() => {
    if (!open) {
      resetForm();
      setProducts([]);
      setLoadingProducts(false);
    }
  }, [open, supplierId]);

  useEffect(() => {
    if (!open || !supplierId) return;

    let isActive = true;

    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, nome, preco')
          .eq('supplier_id', supplierId)
          .eq('ativo', true)
          .order('nome');
        if (error) {
          console.error('Error fetching products:', error);
        }

        if (!isActive) return;

        const nextProducts = (data || []) as SupplierProduct[];
        setProducts(nextProducts);

        if (nextProducts.length > 0) {
          const firstProduct = nextProducts[0];
          setSelectedProductId(firstProduct.id);
          setProductName(firstProduct.nome);
          setAgreedPrice(String(firstProduct.preco));
        }
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        if (isActive) {
          setLoadingProducts(false);
        }
      }
    };

    fetchProducts();

    return () => {
      isActive = false;
    };
  }, [open, supplierId]);

  const handleSubmit = async () => {
    const normalizedPrice = Number(agreedPrice);

    if (!productName.trim() || Number.isNaN(normalizedPrice) || normalizedPrice <= 0 || quantity < 1) {
      return;
    }

    setSubmitting(true);
    try {
      await createNegotiation({
        supplier_id: supplierId,
        product_id: selectedProductId || undefined,
        product_name: productName,
        quantity,
        agreed_price: normalizedPrice,
        payment_method: paymentMethod,
        expected_delivery: expectedDelivery || undefined,
        notes: notes || undefined,
      });
      onOpenChange(false);
      resetForm();
    } catch {
      // error handled by hook
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = productName.trim().length > 0 && Number(agreedPrice) > 0 && quantity >= 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Registrar Negociação
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Produto negociado</Label>
            {loadingProducts ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando produtos...
              </div>
            ) : products.length > 0 ? (
              <select
                value={selectedProductId}
                onChange={e => handleProductSelect(e.target.value)}
                className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                value={productName}
                onChange={e => setProductName(e.target.value)}
                placeholder="Nome do produto"
              />
            )}
            {products.length > 0 && selectedProductId && (
              <p className="text-xs text-muted-foreground mt-1">Produto e valor inicial preenchidos automaticamente.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Quantidade</Label>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={e => setQuantity(parseInt(e.target.value) || 1)}
              />
            </div>
            <div>
              <Label>Valor combinado (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min={0}
                value={agreedPrice}
                onChange={e => setAgreedPrice(e.target.value)}
                placeholder="0,00"
              />
            </div>
          </div>

          <div>
            <Label>Forma de pagamento combinada</Label>
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value)}
              className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              {paymentMethodOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-muted-foreground mt-1">Apenas informativo — pagamento feito diretamente entre as partes</p>
          </div>

          <div>
            <Label>Data prevista de entrega</Label>
            <Input
              type="date"
              value={expectedDelivery}
              onChange={e => setExpectedDelivery(e.target.value)}
            />
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Detalhes adicionais da negociação..."
              rows={3}
            />
          </div>

          <Button onClick={handleSubmit} disabled={submitting || !canSubmit} className="w-full">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
            Registrar Negociação
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
