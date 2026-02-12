import { ArrowLeftRight, Store, Boxes } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppMode } from '@/hooks/useAppMode';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface ModeSwitcherProps {
  variant?: 'default' | 'compact' | 'mobile';
  className?: string;
}

export function ModeSwitcher({ variant = 'default', className }: ModeSwitcherProps) {
  const { mode, toggleMode, isDropMode } = useAppMode();
  const navigate = useNavigate();

  const handleToggle = () => {
    toggleMode();
    navigate(isDropMode ? '/cliente' : '/drop');
  };

  if (variant === 'compact') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleToggle}
        className={cn(
          "gap-2 transition-all duration-300",
          isDropMode 
            ? "text-drop-text hover:bg-drop-surface-hover" 
            : "text-foreground hover:bg-muted",
          className
        )}
      >
        <ArrowLeftRight className="h-4 w-4" />
        <span className="hidden sm:inline">
          {isDropMode ? 'Modo Cliente' : 'Nellor Drop'}
        </span>
      </Button>
    );
  }

  if (variant === 'mobile') {
    return (
      <button
        onClick={handleToggle}
        className={cn(
          "flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-300",
          isDropMode 
            ? "bg-drop-accent/10 text-drop-accent border border-drop-accent/20"
            : "bg-primary/10 text-primary border border-primary/20",
          className
        )}
      >
        {isDropMode ? (
          <>
            <Store className="h-5 w-5" />
            <div className="text-left flex-1">
              <p className="font-medium">Voltar ao Modo Cliente</p>
              <p className="text-xs opacity-70">Comprar produtos</p>
            </div>
          </>
        ) : (
          <>
            <Boxes className="h-5 w-5" />
            <div className="text-left flex-1">
              <p className="font-medium">Ativar Nellor Drop</p>
              <p className="text-xs opacity-70">Revender produtos</p>
            </div>
          </>
        )}
        <ArrowLeftRight className="h-4 w-4 opacity-50" />
      </button>
    );
  }

  return (
    <div className={cn("flex items-center gap-2 p-1 rounded-xl bg-muted/50", className)}>
      <button
        onClick={() => !isDropMode && handleToggle()}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 text-sm font-medium",
          !isDropMode 
            ? "bg-background text-foreground shadow-sm" 
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Store className="h-4 w-4" />
        Cliente
      </button>
      <button
        onClick={() => isDropMode && handleToggle()}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 text-sm font-medium",
          isDropMode 
            ? "bg-primary text-primary-foreground shadow-sm" 
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Boxes className="h-4 w-4" />
        Nellor Drop
      </button>
    </div>
  );
}
