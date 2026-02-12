import { Lock } from "lucide-react";

interface ComingSoonOverlayProps {
  title?: string;
  description?: string;
}

const ComingSoonOverlay = ({
  title = "Em Breve",
  description = "Funcionalidade em desenvolvimento. Disponível em breve.",
}: ComingSoonOverlayProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 text-center px-6 max-w-sm">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
          <Lock className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
    </div>
  );
};

export default ComingSoonOverlay;
