import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface ProductReview {
  id: string;
  productId: number;
  orderId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface StoreReview {
  id: string;
  storeId: number;
  orderId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

interface ReviewsContextType {
  productReviews: ProductReview[];
  storeReviews: StoreReview[];
  addProductReview: (review: Omit<ProductReview, 'id' | 'date'>) => void;
  addStoreReview: (review: Omit<StoreReview, 'id' | 'date'>) => void;
  getProductReviews: (productId: number) => ProductReview[];
  getStoreReviews: (storeId: number) => StoreReview[];
  hasReviewedOrder: (orderId: string) => boolean;
}

const ReviewsContext = createContext<ReviewsContextType | undefined>(undefined);

export const ReviewsProvider = ({ children }: { children: ReactNode }) => {
  const [productReviews, setProductReviews] = useState<ProductReview[]>(() => {
    const saved = localStorage.getItem('product_reviews');
    return saved ? JSON.parse(saved) : [];
  });

  const [storeReviews, setStoreReviews] = useState<StoreReview[]>(() => {
    const saved = localStorage.getItem('store_reviews');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('product_reviews', JSON.stringify(productReviews));
  }, [productReviews]);

  useEffect(() => {
    localStorage.setItem('store_reviews', JSON.stringify(storeReviews));
  }, [storeReviews]);

  const addProductReview = (review: Omit<ProductReview, 'id' | 'date'>) => {
    const newReview: ProductReview = {
      ...review,
      id: `PR${Date.now()}`,
      date: new Date().toLocaleDateString('pt-BR')
    };
    setProductReviews(prev => [newReview, ...prev]);
  };

  const addStoreReview = (review: Omit<StoreReview, 'id' | 'date'>) => {
    const newReview: StoreReview = {
      ...review,
      id: `SR${Date.now()}`,
      date: new Date().toLocaleDateString('pt-BR')
    };
    setStoreReviews(prev => [newReview, ...prev]);
  };

  const getProductReviews = (productId: number) => {
    return productReviews.filter(review => review.productId === productId);
  };

  const getStoreReviews = (storeId: number) => {
    return storeReviews.filter(review => review.storeId === storeId);
  };

  const hasReviewedOrder = (orderId: string) => {
    return storeReviews.some(review => review.orderId === orderId);
  };

  return (
    <ReviewsContext.Provider value={{
      productReviews,
      storeReviews,
      addProductReview,
      addStoreReview,
      getProductReviews,
      getStoreReviews,
      hasReviewedOrder
    }}>
      {children}
    </ReviewsContext.Provider>
  );
};

export const useReviews = () => {
  const context = useContext(ReviewsContext);
  if (context === undefined) {
    throw new Error('useReviews must be used within ReviewsProvider');
  }
  return context;
};
