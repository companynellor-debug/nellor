export interface Product {
  id: number;
  name: string;
  price: string;
  priceNumber: number;
  rating: number;
  reviews: number;
  description: string;
  images: string[];
  specs: { label: string; value: string }[];
  customerReviews: {
    name: string;
    rating: number;
    comment: string;
    date: string;
  }[];
  category: string;
  storeId: number;
  minQuantity?: number;
  minValue?: number;
}

export const products: Product[] = [
  {
    id: 1,
    name: "Tênis Esportivo Premium",
    price: "R$ 299,90",
    priceNumber: 299.90,
    rating: 4.8,
    reviews: 124,
    description: "Tênis esportivo de alta qualidade, perfeito para corridas e treinos intensos. Tecnologia de amortecimento avançada e design moderno.",
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&h=600&fit=crop",
    ],
    specs: [
      { label: "Material", value: "Mesh respirável" },
      { label: "Solado", value: "Borracha antiderrapante" },
      { label: "Peso", value: "280g" },
      { label: "Cores", value: "Preto, Branco, Azul" },
    ],
    customerReviews: [
      { name: "João Silva", rating: 5, comment: "Excelente produto! Super confortável.", date: "15/10/2024" },
      { name: "Maria Santos", rating: 5, comment: "Adorei! Qualidade impecável.", date: "10/10/2024" },
      { name: "Pedro Costa", rating: 4, comment: "Muito bom, recomendo!", date: "05/10/2024" },
    ],
    category: "Calçados",
    storeId: 1,
  },
  {
    id: 2,
    name: "Bolsa de Couro Elegante",
    price: "R$ 189,90",
    priceNumber: 189.90,
    rating: 4.9,
    reviews: 87,
    description: "Bolsa de couro genuíno com design elegante e sofisticado. Compartimentos internos organizados para facilitar seu dia a dia.",
    images: [
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&h=600&fit=crop",
    ],
    specs: [
      { label: "Material", value: "Couro genuíno" },
      { label: "Dimensões", value: "35cm x 28cm x 12cm" },
      { label: "Peso", value: "680g" },
      { label: "Cores", value: "Marrom, Preto, Caramelo" },
    ],
    customerReviews: [
      { name: "Ana Paula", rating: 5, comment: "Linda bolsa, couro de excelente qualidade!", date: "18/10/2024" },
      { name: "Carla Mendes", rating: 5, comment: "Perfeita! Cabe tudo que preciso.", date: "12/10/2024" },
      { name: "Beatriz Lima", rating: 4, comment: "Muito boa, vale o preço.", date: "08/10/2024" },
    ],
    category: "Acessórios",
    storeId: 2,
  },
  {
    id: 3,
    name: "Relógio Smartwatch",
    price: "R$ 399,90",
    priceNumber: 399.90,
    rating: 4.7,
    reviews: 156,
    description: "Smartwatch completo com monitoramento de saúde, GPS, resistência à água e bateria de longa duração. Perfeito para seu estilo de vida ativo.",
    images: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600&h=600&fit=crop",
    ],
    specs: [
      { label: "Tela", value: "AMOLED 1.4 polegadas" },
      { label: "Bateria", value: "Até 7 dias" },
      { label: "Resistência", value: "5 ATM" },
      { label: "Compatibilidade", value: "iOS e Android" },
    ],
    customerReviews: [
      { name: "Ricardo Alves", rating: 5, comment: "Smartwatch excelente! Muitas funções.", date: "20/10/2024" },
      { name: "Fernando Costa", rating: 4, comment: "Ótimo custo-benefício.", date: "16/10/2024" },
      { name: "Lucas Martins", rating: 5, comment: "Supera as expectativas!", date: "11/10/2024" },
    ],
    category: "Eletrônicos",
    storeId: 3,
  },
  {
    id: 4,
    name: "Fone Bluetooth Pro",
    price: "R$ 249,90",
    priceNumber: 249.90,
    rating: 4.6,
    reviews: 203,
    description: "Fone de ouvido sem fio com cancelamento de ruído ativo, qualidade de áudio premium e até 30 horas de bateria. Conforto garantido para o dia todo.",
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&h=600&fit=crop",
    ],
    specs: [
      { label: "Conectividade", value: "Bluetooth 5.0" },
      { label: "Bateria", value: "Até 30 horas" },
      { label: "Cancelamento de ruído", value: "Ativo (ANC)" },
      { label: "Peso", value: "250g" },
    ],
    customerReviews: [
      { name: "Gabriel Santos", rating: 5, comment: "Som incrível! Cancelamento de ruído top.", date: "22/10/2024" },
      { name: "Marcelo Dias", rating: 4, comment: "Muito bom, confortável.", date: "17/10/2024" },
      { name: "Rafael Souza", rating: 5, comment: "Melhor fone que já tive!", date: "13/10/2024" },
    ],
    category: "Eletrônicos",
    storeId: 4,
  },
];

export const getProductById = (id: number): Product | undefined => {
  return products.find((product) => product.id === id);
};

export const getRelatedProducts = (currentProductId: number, category: string, limit: number = 2): Product[] => {
  return products
    .filter((product) => product.id !== currentProductId && product.category === category)
    .slice(0, limit);
};

export const getProductsByStore = (storeId: number): Product[] => {
  return products.filter((product) => product.storeId === storeId);
};
