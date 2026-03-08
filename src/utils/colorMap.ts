// Maps common Portuguese color names to hex values for UI dots
const COLOR_MAP: Record<string, string> = {
  preto: '#000000',
  branco: '#FFFFFF',
  vermelho: '#EF4444',
  azul: '#3B82F6',
  verde: '#22C55E',
  amarelo: '#EAB308',
  rosa: '#EC4899',
  roxo: '#8B5CF6',
  laranja: '#F97316',
  marrom: '#92400E',
  cinza: '#6B7280',
  bege: '#D2B48C',
  dourado: '#FFD700',
  prata: '#C0C0C0',
  vinho: '#722F37',
  azul marinho: '#1E3A5F',
  'azul claro': '#93C5FD',
  'verde escuro': '#166534',,
  caramelo: '#C68E17',
  nude: '#E8C39E',
  coral: '#FF7F50',
  creme: '#FFFDD0',
  bordô: '#800020',
  terracota: '#CC4E24',
  mostarda: '#E2A500',
  off white: '#FAF9F6',
  grafite: '#474747',
  chumbo: '#36454F',
  chocolate: '#7B3F00',
  areia: '#C2B280',
};

export const getColorHex = (colorName: string): string | null => {
  const normalized = colorName.toLowerCase().trim();
  return COLOR_MAP[normalized] || null;
};

export const isLightColor = (hex: string): boolean => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 186;
};
