import { Shield, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface VerifiedSupplierBadgeProps {
  verified: boolean;
  size?: 'sm' | 'md';
  suspended?: boolean;
}

export const VerifiedSupplierBadge = ({ verified, size = 'sm', suspended }: VerifiedSupplierBadgeProps) => {
  if (suspended) {
    return (
      <Badge className="bg-destructive/10 text-destructive border-destructive/20 gap-1 text-[10px]">
        <Shield className="h-3 w-3" />
        Conta Suspensa
      </Badge>
    );
  }

  if (!verified) return null;

  if (size === 'sm') {
    return (
      <Badge className="bg-green-100 text-green-700 border-green-200 gap-1 text-[10px]">
        <ShieldCheck className="h-3 w-3" />
        Verificado
      </Badge>
    );
  }

  return (
    <Badge className="bg-green-100 text-green-700 border-green-200 gap-1">
      <ShieldCheck className="h-3.5 w-3.5" />
      Fornecedor Verificado
    </Badge>
  );
};
