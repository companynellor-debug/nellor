import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StripeAccountStatus {
  connected: boolean;
  accountId: string | null;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  stripeReady: boolean;
  businessType?: string;
  country?: string;
}

interface PaymentResult {
  sessionId: string;
  url: string;
  platformFee: number;
  platformFeePercentage: number;
  supplierAmount: number;
  stripeConnectedAccountId: string;
}

export const useStripeConnect = () => {
  const [loading, setLoading] = useState(false);
  const [accountStatus, setAccountStatus] = useState<StripeAccountStatus | null>(null);

  // Start Stripe Connect onboarding for supplier
  const startOnboarding = async (returnUrl?: string): Promise<string | null> => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast.error('Você precisa estar logado');
        return null;
      }

      const response = await supabase.functions.invoke('stripe-connect-onboarding', {
        body: { returnUrl },
      });

      if (response.error) {
        console.error('Onboarding error:', response.error);
        toast.error('Erro ao iniciar conexão com Stripe');
        return null;
      }

      const { url, accountId } = response.data;
      console.log('Onboarding URL:', url, 'Account ID:', accountId);
      
      return url;
    } catch (error) {
      console.error('Stripe onboarding error:', error);
      toast.error('Erro ao conectar com Stripe');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Check supplier's Stripe account status
  const checkAccountStatus = async (supplierId?: string): Promise<StripeAccountStatus | null> => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        return null;
      }

      const response = await supabase.functions.invoke('stripe-check-account', {
        body: supplierId ? { supplierId } : undefined,
      });

      if (response.error) {
        console.error('Check account error:', response.error);
        return null;
      }

      const status = response.data as StripeAccountStatus;
      setAccountStatus(status);
      return status;
    } catch (error) {
      console.error('Stripe check account error:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Check if a supplier is ready to receive payments
  const isSupplierReady = async (supplierId: string): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        return false;
      }

      const response = await supabase.functions.invoke('stripe-check-account', {
        body: { supplierId },
      });

      if (response.error) {
        return false;
      }

      return response.data?.stripeReady === true;
    } catch (error) {
      console.error('Error checking supplier ready status:', error);
      return false;
    }
  };

  // Create payment with automatic split (7.5% platform fee)
  const createPayment = async (
    orderId: string,
    supplierId: string,
    amount: number,
    description?: string,
    successUrl?: string,
    cancelUrl?: string
  ): Promise<PaymentResult | null> => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast.error('Você precisa estar logado');
        return null;
      }

      const response = await supabase.functions.invoke('stripe-create-payment', {
        body: {
          orderId,
          supplierId,
          amount,
          description,
          successUrl,
          cancelUrl,
        },
      });

      if (response.error) {
        console.error('Create payment error:', response.error);
        
        // Check for specific error codes
        const errorData = response.error as any;
        if (errorData?.message?.includes('SUPPLIER_NOT_READY') || 
            errorData?.message?.includes('não completou')) {
          toast.error('O fornecedor ainda não completou a configuração do Stripe');
        } else {
          toast.error('Erro ao criar pagamento');
        }
        return null;
      }

      return response.data as PaymentResult;
    } catch (error) {
      console.error('Stripe payment error:', error);
      toast.error('Erro ao processar pagamento');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Redirect to Stripe Checkout
  const redirectToCheckout = async (
    orderId: string,
    supplierId: string,
    amount: number,
    description?: string
  ): Promise<boolean> => {
    const result = await createPayment(orderId, supplierId, amount, description);
    
    if (result?.url) {
      window.location.href = result.url;
      return true;
    }
    
    return false;
  };

  return {
    loading,
    accountStatus,
    startOnboarding,
    checkAccountStatus,
    isSupplierReady,
    createPayment,
    redirectToCheckout,
  };
};
