import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [logoClicks, setLogoClicks] = useState(0);
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");

  const handleLogoClick = () => {
    const newCount = logoClicks + 1;
    setLogoClicks(newCount);
    
    if (newCount === 5) {
      setShowAdminDialog(true);
      setLogoClicks(0);
    }
  };

  const handleAdminLogin = async () => {
    try {
      if (!adminPassword) {
        toast.error("Digite a senha!");
        return;
      }

      const { data, error } = await supabase.functions.invoke('admin-grant-role', {
        body: { password: adminPassword },
      });

      if (error || !data?.ok) {
        toast.error("Senha incorreta!");
        setAdminPassword("");
        return;
      }

      toast.success("Acesso admin autorizado!");
      navigate("/admin");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao validar acesso admin");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    login(formData.email, formData.password, formData.name, 'cliente');
    
    if (isSignup) {
      toast.success("Conta criada com sucesso!");
    } else {
      toast.success("Login realizado com sucesso!");
    }
    
    setTimeout(() => {
      navigate("/cliente");
    }, 500);
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-secondary to-accent p-4">
        <Card className="w-full max-w-md p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div onClick={handleLogoClick} className="cursor-pointer">
              <h1 className="text-3xl font-heading font-bold text-primary mb-2">nellor</h1>
            </div>
            <p className="text-muted-foreground">
              {isSignup ? "Crie sua conta de cliente" : "Entre na sua conta"}
            </p>
          </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <div>
              <label className="block text-sm font-medium mb-2">Nome completo</label>
              <Input 
                type="text"
                placeholder="Seu nome"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">E-mail</label>
            <Input 
              type="email"
              placeholder="seu@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Senha</label>
            <Input 
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
            {isSignup ? "Criar conta" : "Entrar"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsSignup(!isSignup)}
            className="text-sm text-primary hover:underline"
          >
            {isSignup ? "Já tem uma conta? Entrar" : "Não tem conta? Criar conta"}
          </button>
        </div>

        <div className="mt-6 pt-6 border-t text-center">
          <Link to="/login-fornecedor" className="text-sm text-muted-foreground hover:text-primary">
            Entrar como fornecedor →
          </Link>
        </div>
      </Card>
    </div>

    <Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
            🔐 Acesso Administrativo
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Digite a senha de acesso ao painel admin
          </p>
          <Input
            type="password"
            placeholder="Senha administrativa"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
            className="text-center"
          />
          <Button 
            onClick={handleAdminLogin}
            className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
          >
            Acessar Painel Admin
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </>
  );
};

export default Login;
