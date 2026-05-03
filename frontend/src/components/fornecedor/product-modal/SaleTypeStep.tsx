import { SaleType, SALE_TYPE_CONFIG } from './types';

interface Props {
  value: SaleType;
  onChange: (type: SaleType) => void;
}

const SALE_TYPES: SaleType[] = ['unit', 'closed_box', 'bale', 'kit', 'pair'];

export default function SaleTypeStep({ value, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold">Como você vende esse produto?</h2>
        <p className="text-sm text-muted-foreground mt-1">Selecione o tipo de venda para personalizar o cadastro</p>
      </div>
      <div className="grid gap-3">
        {SALE_TYPES.map((type) => {
          const config = SALE_TYPE_CONFIG[type];
          const isSelected = value === type;
          return (
            <button
              key={type}
              onClick={() => onChange(type)}
              className={`flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                isSelected
                  ? 'border-primary bg-primary/5 shadow-md'
                  : 'border-border hover:border-primary/40 hover:bg-muted/50'
              }`}
            >
              <span className="text-3xl mt-0.5">{config.icon}</span>
              <div className="flex-1">
                <p className={`font-semibold text-base ${isSelected ? 'text-primary' : ''}`}>{config.label}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{config.description}</p>
              </div>
              {isSelected && (
                <span className="text-primary font-bold text-lg">✓</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
