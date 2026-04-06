import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Phone, CheckCircle, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { toast } from "sonner";

export const PhoneVerification = () => {
  const { user, profile, updateProfile } = useSupabaseAuth();
  const [phone, setPhone] = useState(profile?.telefone || "");
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const isVerified = (profile as any)?.phone_verified;

  if (isVerified) {
    return (
      <Card className="p-4 border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">Telefone Verificado</p>
            <p className="text-xs text-muted-foreground">{profile?.telefone}</p>
          </div>
          <Badge className="bg-green-100 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Verificado
          </Badge>
        </div>
      </Card>
    );
  }

  const handleSendCode = async () => {
    if (!phone || phone.length < 10) {
      toast.error("Digite um telefone válido com DDD");
      return;
    }
    if (!user) return;

    setLoading(true);
    try {
      // Simulated: store code 123456
      const { error } = await supabase
        .from('phone_verification_codes' as any)
        .insert([{
          user_id: user.id,
          phone,
          code: '123456',
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        }] as any);

      if (error) throw error;

      setCodeSent(true);
      toast.success("Código enviado! (Simulação: use 123456)");
    } catch (error: any) {
      toast.error("Erro ao enviar código: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!code || !user) return;

    setLoading(true);
    try {
      // Check code
      const { data, error } = await supabase
        .from('phone_verification_codes' as any)
        .select('*')
        .eq('user_id', user.id)
        .eq('code', code)
        .eq('verified', false)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      if (!data || (data as any[]).length === 0) {
        toast.error("Código inválido ou expirado");
        setLoading(false);
        return;
      }

      // Mark as verified
      await supabase
        .from('phone_verification_codes' as any)
        .update({ verified: true } as any)
        .eq('id', (data as any[])[0].id);

      // Update profile
      await supabase
        .from('profiles')
        .update({ 
          phone_verified: true, 
          phone_verified_at: new Date().toISOString(),
          telefone: phone 
        } as any)
        .eq('id', user.id);

      toast.success("Telefone verificado com sucesso!");
      // Force reload profile
      window.location.reload();
    } catch (error: any) {
      toast.error("Erro ao verificar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 border shadow-sm space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
          <Phone className="h-5 w-5 text-orange-600" />
        </div>
        <div>
          <p className="text-sm font-semibold">Verificar Telefone</p>
          <p className="text-xs text-muted-foreground">Desbloqueie chat completo e ganhe badge de verificado</p>
        </div>
      </div>

      {!codeSent ? (
        <div className="flex gap-2">
          <Input
            placeholder="(11) 99999-9999"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleSendCode} disabled={loading} size="sm" className="gap-1">
            <Send className="h-3.5 w-3.5" />
            Enviar SMS
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Digite o código de 6 dígitos recebido:</p>
          <div className="flex gap-2">
            <Input
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              className="flex-1"
            />
            <Button onClick={handleVerify} disabled={loading || code.length !== 6} size="sm">
              Verificar
            </Button>
          </div>
          <button onClick={() => setCodeSent(false)} className="text-xs text-primary underline">
            Reenviar código
          </button>
        </div>
      )}
    </Card>
  );
};
