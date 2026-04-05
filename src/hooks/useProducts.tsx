import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product as BaseProduct } from '@/data/products';
import { useSupabaseProducts } from './useSupabaseProducts';
import { useSupabaseCategories, Category } from './useSupabaseCategories';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrencyFromDecimal } from '@/utils/currency';

export interface Product extends BaseProduct {}

interface ProductsContextType {
  products: Product[];
  categories: Category[];
  getProductById: (id: number) => Product | undefined;
  getRelatedProducts: (currentProductId: number, category: string, limit?: number) => Product[];
  getProductsByStore: (storeId: number) => Product[];
  getProductsByCategory: (categoryIdOrSlug: string) => Product[];
  getCategoryName: (categoryId: string | null) => string;
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export const ProductsProvider = ({ children }: { children: ReactNode }) => {
  const { products: supabaseProducts, loading } = useSupabaseProducts();
  const { categories } = useSupabaseCategories();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [supplierProfiles, setSupplierProfiles] = useState<Record<string, any>>({});

  // Criar mapa de categorias para lookup rápido
  const categoryMap = categories.reduce((acc, cat) => {
    acc[cat.id] = cat;
    return acc;
  }, {} as Record<string, Category>);

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
      const categoryData = sp.categoria_id ? categoryMap[sp.categoria_id] : null;
      
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
        price: formatCurrencyFromDecimal(sp.preco),
        priceNumber: sp.preco,
        rating: sp.rating_medio || 0,
        reviews: sp.total_reviews || 0,
        salesCount: sp.vendas_count || 0,
        description: sp.descricao_longa || sp.descricao_curta || '',
        images: sp.imagens.length > 0 ? sp.imagens : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop'],
        specs: [],
        customerReviews: [],
        category: categoryData?.slug || 'outros',
        categoryId: sp.categoria_id,
        categoryName: categoryData?.nome || 'Outros',
        storeId: hashCode(sp.supplier_id),
        minQuantity: 1,
        minValue: 0,
        supplierUuid: sp.id,
        supplierProfileId: sp.supplier_id,
        saleUnit: (sp as any).sale_unit || 'unit',
        unitsPerSaleUnit: (sp as any).units_per_sale_unit || 1,
        baleApproxPieces: (sp.variacoes as any)?.baleApproxPieces || null,
        kitItemsCount: sp.is_kit && sp.kit_items ? (sp.kit_items as any[]).length : 0,
      };
    });

    setAllProducts(convertedProducts);
  }, [supabaseProducts, supplierProfiles, categories]);

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

  const getProductsByCategory = (categoryIdOrSlug: string): Product[] => {
    return allProducts.filter((product) => 
      product.category === categoryIdOrSlug || 
      (product as any).categoryId === categoryIdOrSlug
    );
  };

  const getCategoryName = (categoryId: string | null): string => {
    if (!categoryId) return 'Sem categoria';
    return categoryMap[categoryId]?.nome || 'Outros';
  };

  return (
    <ProductsContext.Provider value={{ 
      products: allProducts, 
      categories,
      getProductById, 
      getRelatedProducts, 
      getProductsByStore,
      getProductsByCategory,
      getCategoryName
    }}>
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
