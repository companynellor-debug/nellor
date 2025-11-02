import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

const LoginFornecedor = () => {
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    email: "",
    password: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSignup) {
      toast.success("Conta de fornecedor criada com sucesso!");
    } else {
      toast.success("Login de fornecedor realizado com sucesso!");
    }
    
    // Simular login/cadastro
    setTimeout(() => {
      navigate("/fornecedor");
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-accent via-secondary to-primary p-4">
      <Card className="w-full max-w-md p-8 shadow-2xl">
        <div className="text-center mb-8">
          <Link to="/">
            <h1 className="text-3xl font-heading font-bold text-primary mb-2">nellor</h1>
          </Link>
          <p className="text-muted-foreground">
            {isSignup ? "Cadastre sua empresa" : "Área do Fornecedor"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <div>
              <label className="block text-sm font-medium mb-2">Nome da empresa</label>
              <Input 
                type="text"
                placeholder="Sua empresa"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">E-mail corporativo</label>
            <Input 
              type="email"
              placeholder="empresa@email.com"
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
            {isSignup ? "Cadastrar empresa" : "Entrar como fornecedor"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsSignup(!isSignup)}
            className="text-sm text-primary hover:underline"
          >
            {isSignup ? "Já é fornecedor? Entrar" : "Primeira vez? Cadastrar empresa"}
          </button>
        </div>

        <div className="mt-6 pt-6 border-t text-center">
          <Link to="/login" className="text-sm text-muted-foreground hover:text-primary">
            Entrar como cliente →
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default LoginFornecedor;
