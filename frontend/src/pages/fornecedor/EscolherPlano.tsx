import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Redirect to new subscription flow
const EscolherPlano = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/fornecedor/assinatura", { replace: true });
  }, [navigate]);
  return null;
};

export default EscolherPlano;
