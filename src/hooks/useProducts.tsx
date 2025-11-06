import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { products as mockProducts, Product as BaseProduct } from '@/data/products';
import { useSupplierProducts } from './useSupplierProducts';
import { useStores } from './useStores';

export interface Product extends BaseProduct {}

interface ProductsContextType {
  products: Product[];
  getProductById: (id: number) => Product | undefined;
  getRelatedProducts: (currentProductId: number, category: string, limit?: number) => Product[];
  getProductsByStore: (storeId: number) => Product[];
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export const ProductsProvider = ({ children }: { children: ReactNode }) => {
  const { products: supplierProducts } = useSupplierProducts();
  const { stores } = useStores();
  const [allProducts, setAllProducts] = useState<Product[]>(mockProducts);

  useEffect(() => {
    // Converter produtos dos fornecedores para o formato Product
    const convertedSupplierProducts: Product[] = supplierProducts.map((sp) => {
      // Encontrar a loja do fornecedor (lojas com totalSales = 0 são lojas de fornecedores)
      const supplierStores = stores.filter(s => s.totalSales === 0 && s.name);
      // Pegar a primeira loja de fornecedor (no futuro, podemos vincular por user ID)
      const store = supplierStores[0];

      // Gerar ID único para o produto baseado no ID do produto do fornecedor
      const hashCode = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          const char = str.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash;
        }
        return Math.abs(hash);
      };

      return {
        id: hashCode(sp.id),
        name: sp.name,
        price: `R$ ${sp.price.toFixed(2).replace('.', ',')}`,
        priceNumber: sp.price,
        rating: 5.0,
        reviews: 0,
        description: sp.description,
        images: sp.images.length > 0 ? sp.images : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop'],
        specs: [],
        customerReviews: [],
        category: sp.category,
        storeId: store?.id || 999999,
        minQuantity: sp.minQuantity,
        minValue: sp.minValue,
      };
    });

    // Combinar produtos mock com produtos de fornecedores
    setAllProducts([...mockProducts, ...convertedSupplierProducts]);
  }, [supplierProducts, stores]);

  const getProductById = (id: number): Product | undefined => {
    return allProducts.find((product) => product.id === id);
  };

  const getRelatedProducts = (currentProductId: number, category: string, limit: number = 2): Product[] => {
    return allProducts
      .filter((product) => product.id !== currentProductId && product.category === category)
      .slice(0, limit);
  };

  const getProductsByStore = (storeId: number): Product[] => {
    return allProducts.filter((product) => product.storeId === storeId);
  };

  return (
    <ProductsContext.Provider value={{ products: allProducts, getProductById, getRelatedProducts, getProductsByStore }}>
      {children}
    </ProductsContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductsContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within ProductsProvider');
  }
  return context;
};
