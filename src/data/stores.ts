export interface Store {
  id: number;
  name: string;
  bio: string;
  avatar: string;
  banner: string;
  rating: number;
  totalSales: number;
  totalReviews: number;
  reviews: {
    name: string;
    rating: number;
    comment: string;
    date: string;
  }[];
}

export const stores: Store[] = [
  {
    id: 1,
    name: "Nike Store Oficial",
    bio: "Loja oficial Nike com produtos autênticos e garantia de qualidade. Entrega rápida e segura para todo o Brasil.",
    avatar: "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=200&h=200&fit=crop",
    banner: "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=1200&h=400&fit=crop",
    rating: 4.9,
    totalSales: 15420,
    totalReviews: 3250,
    reviews: [
      { name: "Carlos Silva", rating: 5, comment: "Loja excelente! Produtos autênticos e entrega rápida.", date: "20/10/2024" },
      { name: "Amanda Costa", rating: 5, comment: "Muito bom! Recomendo!", date: "18/10/2024" },
      { name: "Pedro Santos", rating: 4, comment: "Ótima loja, produtos de qualidade.", date: "15/10/2024" },
    ],
  },
  {
    id: 2,
    name: "Fashion Bags Premium",
    bio: "Especialistas em bolsas e acessórios de couro de alta qualidade. Mais de 10 anos no mercado.",
    avatar: "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=200&h=200&fit=crop",
    banner: "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=1200&h=400&fit=crop",
    rating: 4.8,
    totalSales: 8920,
    totalReviews: 1850,
    reviews: [
      { name: "Julia Lima", rating: 5, comment: "Bolsas lindas e de ótima qualidade!", date: "22/10/2024" },
      { name: "Fernanda Reis", rating: 5, comment: "Adorei! Muito elegante.", date: "19/10/2024" },
      { name: "Mariana Souza", rating: 4, comment: "Produto muito bom, vale o preço.", date: "16/10/2024" },
    ],
  },
  {
    id: 3,
    name: "Tech Store Brasil",
    bio: "Os melhores produtos de tecnologia com preços competitivos. Garantia e suporte técnico especializado.",
    avatar: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200&h=200&fit=crop",
    banner: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&h=400&fit=crop",
    rating: 4.7,
    totalSales: 12350,
    totalReviews: 2680,
    reviews: [
      { name: "Rafael Oliveira", rating: 5, comment: "Smartwatch perfeito! Entrega rápida.", date: "21/10/2024" },
      { name: "Lucas Martins", rating: 5, comment: "Excelente atendimento e produto.", date: "17/10/2024" },
      { name: "Gustavo Alves", rating: 4, comment: "Muito bom, recomendo!", date: "14/10/2024" },
    ],
  },
  {
    id: 4,
    name: "Audio Pro Shop",
    bio: "Especializada em equipamentos de áudio premium. Fones, caixas de som e muito mais com a melhor qualidade.",
    avatar: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=200&h=200&fit=crop",
    banner: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=1200&h=400&fit=crop",
    rating: 4.8,
    totalSales: 9870,
    totalReviews: 2140,
    reviews: [
      { name: "Bruno Costa", rating: 5, comment: "Fone incrível! Som perfeito.", date: "23/10/2024" },
      { name: "Daniel Santos", rating: 5, comment: "Qualidade excelente!", date: "20/10/2024" },
      { name: "Thiago Lima", rating: 4, comment: "Muito bom, vale a pena.", date: "18/10/2024" },
    ],
  },
];

export const getStoreById = (id: number): Store | undefined => {
  return stores.find((store) => store.id === id);
};
