export interface ViaCepResult {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export const formatCep = (value: string): string => {
  const numbers = value.replace(/\D/g, '').slice(0, 8);
  if (numbers.length > 5) {
    return `${numbers.slice(0, 5)}-${numbers.slice(5)}`;
  }
  return numbers;
};

export const fetchAddressByCep = async (cep: string): Promise<ViaCepResult | null> => {
  const cleanCep = cep.replace(/\D/g, '');
  if (cleanCep.length !== 8) return null;

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    if (!response.ok) return null;
    const data: ViaCepResult = await response.json();
    if (data.erro) return null;
    return data;
  } catch {
    return null;
  }
};
