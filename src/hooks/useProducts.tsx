import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product as BaseProduct } from '@/data/products';
import { useSupabaseProducts } from './useSupabaseProducts';
import { supabase } from '@/integrations/supabase/client';

export interface Product extends BaseProduct {}

interface ProductsContextType {
  products: Product[];
  getProductById: (id: number) => Product | undefined;
  getRelatedProducts: (currentProductId: number, category: string, limit?: number) => Product[];
  getProductsByStore: (storeId: number) => Product[];
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export const ProductsProvider = ({ children }: { children: ReactNode }) => {
  const { products: supabaseProducts, loading } = useSupabaseProducts();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [supplierProfiles, setSupplierProfiles] = useState<Record<string, any>>({});

  useEffect(() => {
    const fetchSupplierProfiles = async () => {
      if (supabaseProducts.length === 0) return;
      
      const supplierIds = [...new Set(supabaseProducts.map(p => p.supplier_id))];
      const { data } = await supabase
        .from('profiles')
        .select('id, nome, foto_perfil_url')
        .in('id', supplierIds);
      
      if (data) {
        const profilesMap = data.reduce((acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {} as Record<string, any>);
        setSupplierProfiles(profilesMap);
      }
    };

    fetchSupplierProfiles();
  }, [supabaseProducts]);

  useEffect(() => {
    // Converter produtos do Supabase para o formato Product
    const convertedProducts: Product[] = supabaseProducts.map((sp) => {
      const profile = supplierProfiles[sp.supplier_id];
      
      // Gerar ID numérico único baseado no UUID
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
        name: sp.nome,
        price: `R$ ${sp.preco.toFixed(2).replace('.', ',')}`,
        priceNumber: sp.preco,
        rating: sp.rating_medio || 0,
        reviews: sp.total_reviews || 0,
        description: sp.descricao_longa || sp.descricao_curta || '',
        images: sp.imagens.length > 0 ? sp.imagens : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop'],
        specs: [],
        customerReviews: [],
        category: sp.categoria_id || 'outros',
        storeId: hashCode(sp.supplier_id),
        minQuantity: 1,
        minValue: 0,
        supplierUuid: sp.id,
        supplierProfileId: sp.supplier_id,
      };
    });

    setAllProducts(convertedProducts);
  }, [supabaseProducts, supplierProfiles]);

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
