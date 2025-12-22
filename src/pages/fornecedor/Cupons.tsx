import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { 
  Plus, 
  Tag, 
  Percent, 
  DollarSign, 
  Calendar, 
  Package,
  Trash2,
  Edit,
  Copy,
  CheckCircle,
  XCircle,
  Loader2
} from "lucide-react";
import { useSupplierCoupons } from "@/hooks/useSupplierCoupons";
import { useSupplierProducts } from "@/hooks/useSupplierProducts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";

const CuponsFornecedor = () => {
  const { coupons, loading, saving, createCoupon, toggleCouponStatus, deleteCoupon } = useSupplierCoupons();
  const { products } = useSupplierProducts();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    codigo: "",
    tipo: "percentage" as "percentage" | "fixed",
    valor: "",
    product_id: "",
    expira_em: "",
    uso_maximo: "",
    valor_minimo: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.codigo || !formData.valor) {
      toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
      return;
    }

    try {
      await createCoupon({
        codigo: formData.codigo,
        tipo: formData.tipo,
        valor: parseFloat(formData.valor),
        product_id: formData.product_id || null,
        expira_em: formData.expira_em || null,
        uso_maximo: formData.uso_maximo ? parseInt(formData.uso_maximo) : null,
        valor_minimo: formData.valor_minimo ? parseFloat(formData.valor_minimo) : 0,
      });
      
      setFormData({
        codigo: "",
        tipo: "percentage",
        valor: "",
        product_id: "",
        expira_em: "",
        uso_maximo: "",
        valor_minimo: "",
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Código copiado!" });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este cupom?")) {
      await deleteCoupon(id);
    }
  };

  const activeCoupons = coupons.filter(c => c.ativo);
  const inactiveCoupons = coupons.filter(c => !c.ativo);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cupons de Desconto</h1>
          <p className="text-muted-foreground">Gerencie seus cupons promocionais</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Cupom
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Criar Novo Cupom</DialogTitle>
              <DialogDescription>Configure os detalhes do seu cupom de desconto.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="codigo">Código do Cupom *</Label>
                <Input
                  id="codigo"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                  placeholder="EX: DESCONTO10"
                  className="font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Desconto</Label>
                  <Select value={formData.tipo} onValueChange={(v) => setFormData({ ...formData, tipo: v as "percentage" | "fixed" })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">
                        <div className="flex items-center gap-2">
                          <Percent className="h-4 w-4" />
                          Porcentagem
                        </div>
                      </SelectItem>
                      <SelectItem value="fixed">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Valor Fixo
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valor">Valor *</Label>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                    placeholder={formData.tipo === "percentage" ? "10" : "15.00"}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="product_id">Produto Específico (opcional)</Label>
                <Select value={formData.product_id} onValueChange={(v) => setFormData({ ...formData, product_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os produtos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os produtos</SelectItem>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valor_minimo">Valor Mínimo</Label>
                  <Input
                    id="valor_minimo"
                    type="number"
                    step="0.01"
                    value={formData.valor_minimo}
                    onChange={(e) => setFormData({ ...formData, valor_minimo: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="uso_maximo">Limite de Uso</Label>
                  <Input
                    id="uso_maximo"
                    type="number"
                    value={formData.uso_maximo}
                    onChange={(e) => setFormData({ ...formData, uso_maximo: e.target.value })}
                    placeholder="Ilimitado"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expira_em">Data de Expiração</Label>
                <Input
                  id="expira_em"
                  type="datetime-local"
                  value={formData.expira_em}
                  onChange={(e) => setFormData({ ...formData, expira_em: e.target.value })}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Criar Cupom
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cupons Ativos</p>
                <p className="text-3xl font-bold text-primary">{activeCoupons.length}</p>
              </div>
              <Tag className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Utilizado</p>
                <p className="text-3xl font-bold">{coupons.reduce((sum, c) => sum + c.uso_atual, 0)}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Inativos</p>
                <p className="text-3xl font-bold text-muted-foreground">{inactiveCoupons.length}</p>
              </div>
              <XCircle className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coupons List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : coupons.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <Tag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">Nenhum cupom criado</h3>
            <p className="text-muted-foreground mb-4">Crie seu primeiro cupom de desconto para atrair mais clientes.</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Cupom
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {coupons.map((coupon) => {
            const isExpired = coupon.expira_em && new Date(coupon.expira_em) < new Date();
            const isExhausted = coupon.uso_maximo !== null && coupon.uso_atual >= coupon.uso_maximo;
            
            return (
              <Card key={coupon.id} className={!coupon.ativo ? "opacity-60" : ""}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Coupon Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <code className="text-lg font-bold bg-muted px-3 py-1 rounded-md">
                          {coupon.codigo}
                        </code>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyCode(coupon.codigo)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        {!coupon.ativo && <Badge variant="secondary">Inativo</Badge>}
                        {isExpired && <Badge variant="destructive">Expirado</Badge>}
                        {isExhausted && <Badge variant="outline">Esgotado</Badge>}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          {coupon.tipo === "percentage" ? (
                            <><Percent className="h-3 w-3" /> {coupon.valor}% de desconto</>
                          ) : (
                            <><DollarSign className="h-3 w-3" /> R$ {coupon.valor.toFixed(2).replace(".", ",")} de desconto</>
                          )}
                        </span>
                        {coupon.product && (
                          <span className="flex items-center gap-1">
                            <Package className="h-3 w-3" /> {coupon.product.nome}
                          </span>
                        )}
                        {coupon.uso_maximo && (
                          <span>Uso: {coupon.uso_atual}/{coupon.uso_maximo}</span>
                        )}
                        {coupon.expira_em && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> 
                            {format(new Date(coupon.expira_em), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Ativo</span>
                        <Switch
                          checked={coupon.ativo}
                          onCheckedChange={(checked) => toggleCouponStatus(coupon.id, checked)}
                          disabled={saving}
                        />
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(coupon.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CuponsFornecedor;
