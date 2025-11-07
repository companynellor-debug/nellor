import { useState, useEffect } from 'react';

export interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  link: string;
  order: number;
  active: boolean;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

export const useBanners = () => {
  const [banners, setBanners] = useState<Banner[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('banners');
    if (stored) {
      setBanners(JSON.parse(stored));
    } else {
      // Dados iniciais
      const initial: Banner[] = [
        {
          id: '1',
          title: 'Banner Promoção',
          imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1200&q=80',
          link: '/produtos',
          order: 1,
          active: true,
          createdAt: new Date().toISOString()
        }
      ];
      setBanners(initial);
      localStorage.setItem('banners', JSON.stringify(initial));
    }
  }, []);

  const saveBanners = (newBanners: Banner[]) => {
    setBanners(newBanners);
    localStorage.setItem('banners', JSON.stringify(newBanners));
  };

  const addBanner = (banner: Omit<Banner, 'id' | 'createdAt'>) => {
    const newBanner: Banner = {
      ...banner,
      id: `banner_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    saveBanners([...banners, newBanner]);
    return newBanner;
  };

  const updateBanner = (id: string, updates: Partial<Banner>) => {
    const updated = banners.map(banner => 
      banner.id === id ? { ...banner, ...updates } : banner
    );
    saveBanners(updated);
  };

  const deleteBanner = (id: string) => {
    const filtered = banners.filter(banner => banner.id !== id);
    saveBanners(filtered);
  };

  const toggleBannerStatus = (id: string) => {
    const updated = banners.map(banner => 
      banner.id === id ? { ...banner, active: !banner.active } : banner
    );
    saveBanners(updated);
  };

  const getActiveBanners = () => {
    const now = new Date();
    return banners.filter(banner => {
      if (!banner.active) return false;
      
      // Verifica data de início
      if (banner.startDate) {
        const start = new Date(banner.startDate);
        if (now < start) return false;
      }
      
      // Verifica data de fim
      if (banner.endDate) {
        const end = new Date(banner.endDate);
        end.setHours(23, 59, 59, 999); // Inclui o dia todo
        if (now > end) return false;
      }
      
      return true;
    });
  };

  const getExpiringBanners = (daysBeforeExpiration: number = 5) => {
    const now = new Date();
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysBeforeExpiration);
    
    return banners.filter(banner => {
      if (!banner.active || !banner.endDate) return false;
      
      const endDate = new Date(banner.endDate);
      
      // Banner está ativo e vai expirar nos próximos X dias
      return endDate > now && endDate <= targetDate;
    });
  };

  return {
    banners,
    addBanner,
    updateBanner,
    deleteBanner,
    toggleBannerStatus,
    getActiveBanners,
    getExpiringBanners
  };
};
