import { Search, Plus } from 'lucide-react';
import { SupplierWithStories } from '@/hooks/useSupplierStories';

interface SupplierStoriesProps {
  suppliers: SupplierWithStories[];
  onStoryClick: (supplierId: string) => void;
  onSearchClick: () => void;
  showAddButton?: boolean;
  onAddClick?: () => void;
  myStories?: any[];
}

export const SupplierStories = ({ suppliers, onStoryClick, onSearchClick, showAddButton, onAddClick, myStories }: SupplierStoriesProps) => {
  return (
    <div className="flex gap-3 overflow-x-auto px-4 py-3 scrollbar-hide">
      {/* Search / New Chat button */}
      <button onClick={onSearchClick} className="flex flex-col items-center gap-1 flex-shrink-0">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border-2 border-dashed border-primary/30">
          <Search className="h-6 w-6 text-primary" />
        </div>
        <span className="text-[10px] text-muted-foreground font-medium">Buscar</span>
      </button>

      {/* Add Story (supplier only) */}
      {showAddButton && (
        <button onClick={onAddClick} className="flex flex-col items-center gap-1 flex-shrink-0">
          <div className="w-16 h-16 rounded-full relative">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              {(myStories && myStories.length > 0) ? (
                <span className="text-white font-bold text-lg">{myStories.length}</span>
              ) : (
                <Plus className="h-6 w-6 text-white" />
              )}
            </div>
          </div>
          <span className="text-[10px] text-muted-foreground font-medium">Meu Status</span>
        </button>
      )}

      {/* Supplier Stories */}
      {suppliers.map((supplier) => (
        <button
          key={supplier.supplierId}
          onClick={() => onStoryClick(supplier.supplierId)}
          className="flex flex-col items-center gap-1 flex-shrink-0"
        >
          <div className={`w-16 h-16 rounded-full p-[2.5px] ${
            supplier.hasUnviewed
              ? 'bg-gradient-to-br from-primary via-purple-500 to-pink-500'
              : 'bg-gray-300'
          }`}>
            <div className="w-full h-full rounded-full overflow-hidden bg-white p-[2px]">
              {supplier.supplierAvatar ? (
                <img src={supplier.supplierAvatar} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg">
                  {supplier.supplierName.charAt(0)}
                </div>
              )}
            </div>
          </div>
          <span className="text-[10px] text-muted-foreground font-medium max-w-16 truncate">
            {supplier.supplierName.split(' ')[0]}
          </span>
        </button>
      ))}
    </div>
  );
};
