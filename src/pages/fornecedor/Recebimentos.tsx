import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Recebimentos = () => {
  const navigate = useNavigate();
  useEffect(() => { navigate('/fornecedor/financeiro', { replace: true }); }, [navigate]);
  return null;
};

export default Recebimentos;
