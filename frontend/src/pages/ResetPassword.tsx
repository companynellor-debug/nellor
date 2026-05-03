import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Lock, CheckCircle } from "lucide-react";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    // Check if there's a recovery session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setHasSession(true);
      }
    };

    // Listen for auth state change (recovery token)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setHasSession(true);
      }
    });

    checkSession();
    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async () => {
    if (password.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      toast.success("Senha atualizada com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao atualizar senha: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-secondary to-accent p-4">
      <Card className="w-full max-w-md p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-primary mb-2">nellor</h1>
          <p className="text-muted-foreground">Redefinir senha</p>
        </div>

        {success ? (
          <div className="text-center space-y-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-xl font-bold">Senha atualizada!</h2>
            <p className="text-muted-foreground">Sua senha foi redefinida com sucesso.</p>
            <Button onClick={() => navigate("/login")} className="w-full">
              Ir para Login
            </Button>
          </div>
        ) : !hasSession ? (
          <div className="text-center space-y-4">
            <Lock className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">
              Link inválido ou expirado. Solicite um novo link de recuperação na tela de login.
            </p>
            <Button onClick={() => navigate("/login")} variant="outline" className="w-full">
              Voltar ao Login
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nova senha</label>
              <Input type="password" placeholder="Mínimo 6 caracteres" value={password}
                onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Confirmar nova senha</label>
              <Input type="password" placeholder="Repita a senha" value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleReset()} />
            </div>
            <Button onClick={handleReset} disabled={loading} className="w-full bg-primary hover:bg-primary/90">
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Atualizando...</> : "Redefinir Senha"}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ResetPassword;
