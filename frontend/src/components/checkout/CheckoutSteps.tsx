import { Check, User, FileText, CreditCard } from "lucide-react";

interface CheckoutStepsProps {
  currentStep: number;
}

const steps = [
  { number: 1, label: "Dados do Cliente", icon: User },
  { number: 2, label: "Resumo", icon: FileText },
  { number: 3, label: "Pagamento", icon: CreditCard },
];

export const CheckoutSteps = ({ currentStep }: CheckoutStepsProps) => {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-center">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={step.number} className="flex items-center">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 ${
                    currentStep > step.number
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                      : currentStep === step.number
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-lg"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {currentStep > step.number ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <span
                  className={`mt-2 text-xs font-medium text-center max-w-[80px] transition-colors ${
                    currentStep >= step.number
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={`w-16 sm:w-24 h-1 mx-3 rounded-full transition-all duration-500 ${
                    currentStep > step.number 
                      ? "bg-primary" 
                      : "bg-muted"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
