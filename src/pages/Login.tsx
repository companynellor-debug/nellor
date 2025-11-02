import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSignup) {
      toast.success("Conta criada com sucesso!");
    } else {
      toast.success("Login realizado com sucesso!");
    }
    
    // Simular login/cadastro
    setTimeout(() => {
      navigate("/");
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-secondary to-accent p-4">
      <Card className="w-full max-w-md p-8 shadow-2xl">
        <div className="text-center mb-8">
          <Link to="/">
            <h1 className="text-3xl font-heading font-bold text-primary mb-2">nellor</h1>
          </Link>
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
  );
};

export default Login;
