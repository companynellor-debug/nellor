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

// Dados fictícios removidos - agora usando dados reais do Supabase
export const products: Product[] = [];

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
