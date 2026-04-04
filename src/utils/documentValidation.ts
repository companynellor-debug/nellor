/**
 * Validação de CPF e CNPJ + consulta API pública de CNPJ
 */

export function validateCPF(cpf: string): boolean {
  const nums = cpf.replace(/\D/g, '');
  if (nums.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(nums)) return false; // todos iguais

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(nums[i]) * (10 - i);
  let rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  if (rest !== parseInt(nums[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(nums[i]) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  return rest === parseInt(nums[10]);
}

export function validateCNPJ(cnpj: string): boolean {
  const nums = cnpj.replace(/\D/g, '');
  if (nums.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(nums)) return false;

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseInt(nums[i]) * weights1[i];
  let rest = sum % 11;
  const d1 = rest < 2 ? 0 : 11 - rest;
  if (d1 !== parseInt(nums[12])) return false;

  sum = 0;
  for (let i = 0; i < 13; i++) sum += parseInt(nums[i]) * weights2[i];
  rest = sum % 11;
  const d2 = rest < 2 ? 0 : 11 - rest;
  return d2 === parseInt(nums[13]);
}

export function formatCPF(value: string): string {
  const nums = value.replace(/\D/g, '').slice(0, 11);
  if (nums.length <= 3) return nums;
  if (nums.length <= 6) return `${nums.slice(0, 3)}.${nums.slice(3)}`;
  if (nums.length <= 9) return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6)}`;
  return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6, 9)}-${nums.slice(9)}`;
}

export function formatCNPJ(value: string): string {
  const nums = value.replace(/\D/g, '').slice(0, 14);
  if (nums.length <= 2) return nums;
  if (nums.length <= 5) return `${nums.slice(0, 2)}.${nums.slice(2)}`;
  if (nums.length <= 8) return `${nums.slice(0, 2)}.${nums.slice(2, 5)}.${nums.slice(5)}`;
  if (nums.length <= 12) return `${nums.slice(0, 2)}.${nums.slice(2, 5)}.${nums.slice(5, 8)}/${nums.slice(8)}`;
  return `${nums.slice(0, 2)}.${nums.slice(2, 5)}.${nums.slice(5, 8)}/${nums.slice(8, 12)}-${nums.slice(12)}`;
}

export function formatPhone(value: string): string {
  const nums = value.replace(/\D/g, '').slice(0, 11);
  if (nums.length <= 2) return `(${nums}`;
  if (nums.length <= 7) return `(${nums.slice(0, 2)}) ${nums.slice(2)}`;
  return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7)}`;
}

export interface CNPJData {
  razao_social: string;
  nome_fantasia: string;
  situacao_cadastral: string; // "Ativa", "Baixada", etc.
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
}

export async function fetchCNPJData(cnpj: string): Promise<{ data: CNPJData | null; error: string | null }> {
  const nums = cnpj.replace(/\D/g, '');
  if (nums.length !== 14) return { data: null, error: 'CNPJ deve ter 14 dígitos' };

  try {
    const response = await fetch(`https://publica.cnpj.ws/cnpj/${nums}`);
    
    if (response.status === 429) {
      return { data: null, error: 'Muitas consultas. Aguarde alguns segundos e tente novamente.' };
    }
    
    if (!response.ok) {
      return { data: null, error: 'CNPJ não encontrado na base da Receita Federal' };
    }

    const raw = await response.json();
    
    const situacao = raw.estabelecimento?.situacao_cadastral || '';
    if (situacao !== 'Ativa') {
      return { data: null, error: `CNPJ com situação "${situacao}". Apenas CNPJs ativos são aceitos.` };
    }

    const est = raw.estabelecimento || {};
    return {
      data: {
        razao_social: raw.razao_social || '',
        nome_fantasia: est.nome_fantasia || '',
        situacao_cadastral: situacao,
        logradouro: est.logradouro || '',
        numero: est.numero || '',
        complemento: est.complemento || '',
        bairro: est.bairro || '',
        municipio: est.cidade?.nome || est.municipio || '',
        uf: est.estado?.sigla || est.uf || '',
        cep: (est.cep || '').replace(/\D/g, ''),
      },
      error: null,
    };
  } catch {
    return { data: null, error: 'Erro ao consultar CNPJ. Verifique sua conexão.' };
  }
}
