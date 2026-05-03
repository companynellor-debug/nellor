import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#8B5CF6] via-[#7C3AED] to-[#6D28D9]">
      <div className="text-center text-white">
        <h1 className="mb-4 text-6xl font-bold">404</h1>
        <p className="mb-6 text-xl">Página não encontrada</p>
        <Button 
          onClick={() => navigate('/')} 
          className="bg-white text-[#7C3AED] hover:bg-white/90 font-semibold rounded-full px-8"
        >
          Voltar ao início
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
