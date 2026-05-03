import { useState, useEffect } from 'react';

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  createdAt: string;
}

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('categories');
    if (stored) {
      setCategories(JSON.parse(stored));
    } else {
      // Dados iniciais
      const initial: Category[] = [
        {
          id: '1',
          name: 'Eletrônicos',
          description: 'Produtos eletrônicos e tecnologia',
          icon: '💻',
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Roupas',
          description: 'Vestuário e acessórios',
          icon: '👕',
          createdAt: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Alimentos',
          description: 'Produtos alimentícios',
          icon: '🍎',
          createdAt: new Date().toISOString()
        }
      ];
      setCategories(initial);
      localStorage.setItem('categories', JSON.stringify(initial));
    }
  }, []);

  const saveCategories = (newCategories: Category[]) => {
    setCategories(newCategories);
    localStorage.setItem('categories', JSON.stringify(newCategories));
  };

  const addCategory = (category: Omit<Category, 'id' | 'createdAt'>) => {
    const newCategory: Category = {
      ...category,
      id: `cat_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    saveCategories([...categories, newCategory]);
    return newCategory;
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    const updated = categories.map(cat => 
      cat.id === id ? { ...cat, ...updates } : cat
    );
    saveCategories(updated);
  };

  const deleteCategory = (id: string) => {
    const filtered = categories.filter(cat => cat.id !== id);
    saveCategories(filtered);
  };

  return {
    categories,
    addCategory,
    updateCategory,
    deleteCategory
  };
};
