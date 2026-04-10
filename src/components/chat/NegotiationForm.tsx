import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, Loader2, Calculator, User, ChevronDown, ChevronUp, Upload, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNegotiations } from '@/hooks/useNegotiations';
import { formatCurrency } from '@/utils/formatCurrency';
import { useToast } from '@/hooks/use-toast';

interface NegotiationFormProps {
  supplierId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SupplierProduct {
  id: string;
  nome: string;
  preco: number;
  sale_unit: string | null;
  units_per_sale_unit: number | null;
  min_order_quantity: number | null;
  max_order_quantity: number | null;
}

interface PriceTier {
  min_quantity: number;
  max_quantity: number | null;
  price_per_unit: number;
}

const saleUnitLabels: Record<string, string> = {
  unit: 'Unidade',
  pair: 'Par',
  closed_box: 'Caixa Fechada',
  bale: 'Fardo',
  kit: 'Kit',
};

const paymentMethodOptions = [
  { value: 'pix', label: 'PIX' },
  { value: 'transferencia', label: 'Transferência bancária' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'outro', label: 'Outro' },
];

export const NegotiationForm = ({ supplierId, open, onOpenChange }: NegotiationFormProps) => {
  const { createNegotiation } = useNegotiations(supplierId);
  const { toast } = useToast();
  const [products, setProducts] = useState<SupplierProduct[]>([]);
  const [priceTiers, setPriceTiers] = useState<PriceTier[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [showBuyerData, setShowBuyerData] = useState(false);

  // Payment proof
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [paymentReference, setPaymentReference] = useState('');

  // Buyer data for NF
  const [buyerName, setBuyerName] = useState('');
  const [buyerDocument, setBuyerDocument] = useState('');
  const [buyerIE, setBuyerIE] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');

  const selectedProduct = products.find(p => p.id === selectedProductId);
  const saleUnit = selectedProduct?.sale_unit || 'unit';
  const unitsPerSaleUnit = selectedProduct?.units_per_sale_unit || 1;
  const basePrice = selectedProduct?.preco || 0;

  const needsUnitMultiplier = saleUnit === 'closed_box' || saleUnit === 'bale';

  // Calculate price based on tiers or base price
  const getEffectivePrice = (): number => {
    if (priceTiers.length > 0) {
      const tier = priceTiers.find(t =>
        quantity >= t.min_quantity && (t.max_quantity === null || quantity <= t.max_quantity)
      );
      if (tier) return tier.price_per_unit;
    }
    return basePrice;
  };

  const effectivePrice = getEffectivePrice();
  // For closed_box/bale: price is per individual unit, so total = price × units_per_sale_unit × qty
  // For unit/pair/kit: price is already for the whole sale unit
  const totalEstimated = needsUnitMultiplier
    ? effectivePrice * unitsPerSaleUnit * quantity
    : effectivePrice * quantity;
  const totalUnits = needsUnitMultiplier ? quantity * unitsPerSaleUnit : quantity;

  const resetForm = () => {
    setSelectedProductId('');
    setProductName('');
    setQuantity(1);
    setPaymentMethod('pix');
    setExpectedDelivery('');
    setNotes('');
    setShowBuyerData(false);
    setBuyerName('');
    setBuyerDocument('');
    setBuyerIE('');
    setBuyerPhone('');
    setBuyerAddress('');
    setPriceTiers([]);
    setPaymentProofFile(null);
    setPaymentReference('');
  };

  const handleProductSelect = async (productId: string) => {
    setSelectedProductId(productId);
    const product = products.find(p => p.id === productId);
    if (product) {
      setProductName(product.nome);
      setQuantity(product.min_order_quantity || 1);
      // Fetch price tiers
      try {
        const { data } = await supabase
          .from('product_price_tiers')
          .select('min_quantity, max_quantity, price_per_unit')
          .eq('product_id', productId)
          .order('min_quantity');
        setPriceTiers((data || []) as PriceTier[]);
      } catch {
        setPriceTiers([]);
      }
    }
  };

  // Pre-fill buyer data from profile
  useEffect(() => {
    if (!open) {
      resetForm();
      setProducts([]);
      setLoadingProducts(false);
      return;
    }

    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('nome, telefone, documento')
        .eq('id', user.id)
        .single();
      if (profile) {
        setBuyerName((profile as any).nome || '');
        setBuyerPhone((profile as any).telefone || '');
        setBuyerDocument((profile as any).documento || '');
      }
      // Try default address
      const { data: addr } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .maybeSingle();
      if (addr) {
        setBuyerAddress(`${addr.street}, ${addr.number}${addr.complement ? ' - ' + addr.complement : ''}, ${addr.neighborhood}, ${addr.city}/${addr.state} - CEP ${addr.zip_code}`);
        if (!buyerName && addr.name) setBuyerName(addr.name);
        if (!buyerDocument && addr.document) setBuyerDocument(addr.document);
      }
    };
    loadProfile();
  }, [open]);

  useEffect(() => {
    if (!open || !supplierId) return;
    let isActive = true;

    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, nome, preco, sale_unit, units_per_sale_unit, min_order_quantity, max_order_quantity')
          .eq('supplier_id', supplierId)
          .eq('ativo', true)
          .order('nome');
        if (error) console.error('Error fetching products:', error);
        if (!isActive) return;

        const nextProducts = (data || []) as SupplierProduct[];
        setProducts(nextProducts);

        if (nextProducts.length > 0) {
          handleProductSelect(nextProducts[0].id);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        if (isActive) setLoadingProducts(false);
      }
    };

    fetchProducts();
    return () => { isActive = false; };
  }, [open, supplierId]);

  const handleSubmit = async () => {
    if (!productName.trim() || totalEstimated <= 0 || quantity < 1) return;

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const buyerData: Record<string, any> = {};
      if (buyerName) buyerData.nome = buyerName;
      if (buyerDocument) buyerData.documento = buyerDocument;
      if (buyerIE) buyerData.ie = buyerIE;
      if (buyerPhone) buyerData.telefone = buyerPhone;
      if (buyerAddress) buyerData.endereco = buyerAddress;

      // Upload payment proof if provided
      let proofUrl: string | undefined;
      if (paymentProofFile) {
        const ext = paymentProofFile.name.split('.').pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('payment-proofs')
          .upload(path, paymentProofFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage
          .from('payment-proofs')
          .getPublicUrl(path);
        proofUrl = urlData.publicUrl;
      }

      await createNegotiation({
        supplier_id: supplierId,
        product_id: selectedProductId || undefined,
        product_name: productName,
        quantity,
        agreed_price: totalEstimated,
        payment_method: paymentMethod,
        expected_delivery: expectedDelivery || undefined,
        notes: notes || undefined,
        buyer_data: Object.keys(buyerData).length > 0 ? buyerData : undefined,
        sale_unit: saleUnit,
        unit_price: effectivePrice,
        payment_proof_url: proofUrl,
        payment_reference: paymentReference || undefined,
      });
      onOpenChange(false);
      resetForm();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = productName.trim().length > 0 && totalEstimated > 0 && quantity >= 1;

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
          {/* Product selection */}
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
                    {p.nome} — {saleUnitLabels[p.sale_unit || 'unit'] || 'Unidade'}
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
          </div>

          {/* Quantity and auto-calculated price */}
          <div>
            <Label>
              Quantidade {selectedProduct ? `(${saleUnitLabels[saleUnit] || saleUnit})` : ''}
            </Label>
            <Input
              type="number"
              min={selectedProduct?.min_order_quantity || 1}
              max={selectedProduct?.max_order_quantity || undefined}
              value={quantity}
              onChange={e => setQuantity(parseInt(e.target.value) || 1)}
            />
            {selectedProduct?.min_order_quantity && selectedProduct.min_order_quantity > 1 && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Mín. {selectedProduct.min_order_quantity} {saleUnitLabels[saleUnit]?.toLowerCase() || 'un.'}
              </p>
            )}
          </div>

          {/* Price breakdown */}
          {selectedProduct && (
            <div className="bg-muted/50 rounded-lg p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
                <Calculator className="h-3.5 w-3.5" />
                Cálculo automático
              </div>
              {needsUnitMultiplier ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span>Preço por unidade:</span>
                    <span className="font-medium">{formatCurrency(effectivePrice)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatCurrency(effectivePrice)}/un × {unitsPerSaleUnit} un/{saleUnit === 'closed_box' ? 'cx' : 'fardo'} × {quantity} {saleUnit === 'closed_box' ? 'cx' : 'fardo'}{quantity > 1 ? 's' : ''}</span>
                    <span>= {totalUnits} un.</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-sm">
                  <span>Preço por {saleUnitLabels[saleUnit]?.toLowerCase() || 'un.'}:</span>
                  <span className="font-medium">{formatCurrency(effectivePrice)}</span>
                </div>
              )}
              {priceTiers.length > 0 && (
                <p className="text-[10px] text-muted-foreground">
                  Preço por faixa de quantidade aplicado automaticamente
                </p>
              )}
              <div className="flex justify-between text-sm font-bold pt-1 border-t border-border">
                <span>Total estimado:</span>
                <span className="text-primary">{formatCurrency(totalEstimated)}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                O fornecedor pode ajustar o valor final ao aceitar a negociação
              </p>
            </div>
          )}

          {/* Payment method */}
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
              rows={2}
            />
          </div>

          {/* Buyer data for NF (collapsible) */}
          <div className="border rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setShowBuyerData(!showBuyerData)}
              className="flex items-center justify-between w-full p-3 text-sm font-medium text-left hover:bg-muted/50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Dados para Nota Fiscal
              </span>
              {showBuyerData ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {showBuyerData && (
              <div className="p-3 pt-0 space-y-3">
                <p className="text-[10px] text-muted-foreground">Pré-preenchido do seu perfil. O fornecedor usará esses dados para emitir a NF.</p>
                <div>
                  <Label className="text-xs">Nome / Razão Social</Label>
                  <Input value={buyerName} onChange={e => setBuyerName(e.target.value)} placeholder="Nome completo ou razão social" />
                </div>
                <div>
                  <Label className="text-xs">CPF / CNPJ</Label>
                  <Input value={buyerDocument} onChange={e => setBuyerDocument(e.target.value)} placeholder="000.000.000-00" />
                </div>
                <div>
                  <Label className="text-xs">Inscrição Estadual (opcional)</Label>
                  <Input value={buyerIE} onChange={e => setBuyerIE(e.target.value)} placeholder="Isento ou número" />
                </div>
                <div>
                  <Label className="text-xs">Telefone</Label>
                  <Input value={buyerPhone} onChange={e => setBuyerPhone(e.target.value)} placeholder="(00) 00000-0000" />
                </div>
                <div>
                  <Label className="text-xs">Endereço completo</Label>
                  <Textarea value={buyerAddress} onChange={e => setBuyerAddress(e.target.value)} placeholder="Rua, número, bairro, cidade/UF, CEP" rows={2} />
                </div>
              </div>
            )}
          </div>

          {/* Payment proof upload */}
          <div className="border rounded-lg p-3 space-y-3 bg-green-50/50 dark:bg-green-950/20">
            <div className="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-300">
              <DollarSign className="h-4 w-4" />
              Comprovante de Pagamento
            </div>
            <p className="text-[10px] text-muted-foreground">
              Envie o comprovante junto com a solicitação para agilizar a aprovação.
            </p>
            <div>
              <Label className="text-xs">Referência / código da transação</Label>
              <Input
                value={paymentReference}
                onChange={e => setPaymentReference(e.target.value)}
                placeholder="Ex: código PIX, nº do boleto..."
              />
            </div>
            <div>
              <Label className="text-xs">Comprovante (imagem ou PDF)</Label>
              <Input
                type="file"
                accept="image/*,application/pdf"
                onChange={e => setPaymentProofFile(e.target.files?.[0] || null)}
              />
            </div>
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
