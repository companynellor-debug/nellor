import { useState } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallback?: string;
  sizes?: string;
}

const OptimizedImage = ({ src, alt, width, height, className, fallback = '/placeholder.svg', sizes }: OptimizedImageProps) => {
  const [error, setError] = useState(false);

  return (
    <img
      src={error ? fallback : src}
      alt={alt}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      sizes={sizes}
      onError={() => setError(true)}
      className={cn('object-cover', className)}
    />
  );
};

export default OptimizedImage;
