import { createContext, useContext, useState, ReactNode } from 'react';

export interface SupplierProduct {
  id: string;
  name: string;
  category: string;
  description: string;
  images: string[];
  price: number;
  stock: number;
  minQuantity?: number;
  minValue?: number;
  variations?: { name: string; options: string[] }[];
}

interface SupplierProductsContextType {
  products: SupplierProduct[];
  addProduct: (product: Omit<SupplierProduct, 'id'>) => void;
  updateProduct: (id: string, product: Partial<SupplierProduct>) => void;
  deleteProduct: (id: string) => void;
}

const SupplierProductsContext = createContext<SupplierProductsContextType | undefined>(undefined);

export const SupplierProductsProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<SupplierProduct[]>([]);

  const addProduct = (product: Omit<SupplierProduct, 'id'>) => {
    const newProduct = {
      ...product,
      id: Math.random().toString(36).substr(2, 9),
    };
    setProducts(prev => [...prev, newProduct]);
  };

  const updateProduct = (id: string, updatedData: Partial<SupplierProduct>) => {
    setProducts(prev => prev.map(product => 
      product.id === id ? { ...product, ...updatedData } : product
    ));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(product => product.id !== id));
  };

  return (
    <SupplierProductsContext.Provider value={{ products, addProduct, updateProduct, deleteProduct }}>
      {children}
    </SupplierProductsContext.Provider>
  );
};

export const useSupplierProducts = () => {
  const context = useContext(SupplierProductsContext);
  if (context === undefined) {
    throw new Error('useSupplierProducts must be used within SupplierProductsProvider');
  }
  return context;
};
