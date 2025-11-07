import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DollarSign, Check, X, Clock, User } from "lucide-react";
import { toast } from "sonner";

interface WithdrawalRequest {
  id: string;
  supplierId: string;
  supplierName: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
  bankInfo: string;
}

const Saques = () => {
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [requests, setRequests] = useState<WithdrawalRequest[]>([
    {
      id: "SAQ001",
      supplierId: "F001",
      supplierName: "Loja Exemplo",
      amount: 1500.00,
      status: 'pending',
      date: "15/01/2025",
      bankInfo: "Banco 001 - Ag: 1234 - Conta: 56789-0"
    },
    {
      id: "SAQ002",
      supplierId: "F002",
      supplierName: "Tech Store",
      amount: 3200.50,
      status: 'pending',
      date: "14/01/2025",
      bankInfo: "Banco 237 - Ag: 5678 - Conta: 12345-6"
    },
    {
      id: "SAQ003",
      supplierId: "F003",
      supplierName: "Fashion Plus",
      amount: 890.00,
      status: 'approved',
      date: "10/01/2025",
      bankInfo: "Banco 341 - Ag: 9012 - Conta: 34567-8"
    },
  ]);

  const handleApprove = (id: string) => {
    setRequests(prev => prev.map(req => 
      req.id === id ? { ...req, status: 'approved' as const } : req
    ));
    toast.success("Saque aprovado!");
    setSelectedRequest(null);
  };

  const handleReject = (id: string) => {
    setRequests(prev => prev.map(req => 
      req.id === id ? { ...req, status: 'rejected' as const } : req
    ));
    toast.error("Saque recusado!");
    setSelectedRequest(null);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { label: 'Pendente', class: 'bg-yellow-100 text-yellow-800' },
      approved: { label: 'Aprovado', class: 'bg-green-100 text-green-800' },
      rejected: { label: 'Recusado', class: 'bg-red-100 text-red-800' },
    };
    return badges[status as keyof typeof badges];
  };

  const pendingTotal = requests
    .filter(r => r.status === 'pending')
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2 dark:text-white dark:bg-none">Controle de Saques</h1>
        <p className="text-muted-foreground">Gerencie pedidos de saque dos fornecedores</p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Saques Pendentes</p>
            <Clock className="h-5 w-5 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold">{requests.filter(r => r.status === 'pending').length}</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Total Pendente</p>
            <DollarSign className="h-5 w-5 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold">R$ {pendingTotal.toFixed(2)}</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Aprovados (mês)</p>
            <Check className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold">{requests.filter(r => r.status === 'approved').length}</p>
        </Card>
      </div>

      {/* Lista de Solicitações */}
      <Card>
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Solicitações de Saque</h2>
        </div>
        <div className="divide-y">
          {requests.map((request) => {
            const badge = getStatusBadge(request.status);
            return (
              <div key={request.id} className="p-6 hover:bg-muted/20 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{request.supplierName}</p>
                        <p className="text-xs text-muted-foreground">ID: {request.id}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Valor</p>
                        <p className="font-bold text-lg text-primary">R$ {request.amount.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Data</p>
                        <p>{request.date}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={badge.class}>{badge.label}</Badge>
                    {request.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedRequest(request)}
                      >
                        Ver Detalhes
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Dialog de Detalhes */}
      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Saque</DialogTitle>
            <DialogDescription>Solicitação #{selectedRequest?.id}</DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Fornecedor</p>
                <p className="font-semibold">{selectedRequest.supplierName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Valor Solicitado</p>
                <p className="text-2xl font-bold text-primary">R$ {selectedRequest.amount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Dados Bancários</p>
                <p className="font-mono text-sm">{selectedRequest.bankInfo}</p>
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => handleApprove(selectedRequest.id)}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Aprovar
                </Button>
                <Button
                  className="flex-1"
                  variant="destructive"
                  onClick={() => handleReject(selectedRequest.id)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Recusar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Saques;
