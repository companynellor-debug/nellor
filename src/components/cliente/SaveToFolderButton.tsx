import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FolderPlus, Folder, Loader2 } from "lucide-react";
import { useCollections } from "@/hooks/useCollections";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { toast } from "@/hooks/use-toast";

interface SaveToFolderButtonProps {
  type: "product" | "supplier";
  referenceId: string;
  variant?: "icon" | "menu-item";
}

const SaveToFolderButton = ({
  type,
  referenceId,
  variant = "icon",
}: SaveToFolderButtonProps) => {
  const { user } = useSupabaseAuth();
  const { collections, addItemToCollection } = useCollections();
  const [saving, setSaving] = useState<string | null>(null);

  if (!user) return null;

  const handleSave = async (collectionId: string, collectionName: string) => {
    setSaving(collectionId);
    await addItemToCollection(collectionId, type, referenceId);
    setSaving(null);
  };

  if (variant === "menu-item") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-muted rounded transition-colors">
            <FolderPlus className="h-4 w-4" />
            Salvar em Pasta
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel>Escolher pasta</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {collections.length === 0 ? (
            <DropdownMenuItem disabled className="text-muted-foreground text-xs">
              Nenhuma pasta criada ainda
            </DropdownMenuItem>
          ) : (
            collections.map((col) => (
              <DropdownMenuItem
                key={col.id}
                onClick={() => handleSave(col.id, col.name)}
                disabled={saving === col.id}
              >
                {saving === col.id ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Folder className="h-4 w-4 mr-2 text-primary" />
                )}
                <span className="truncate">{col.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {col.items_count}
                </span>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Salvar em pasta"
          onClick={(e) => e.stopPropagation()}
        >
          <FolderPlus className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Salvar em pasta</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {collections.length === 0 ? (
          <DropdownMenuItem disabled className="text-muted-foreground text-xs">
            Nenhuma pasta criada — crie uma no seu perfil
          </DropdownMenuItem>
        ) : (
          collections.map((col) => (
            <DropdownMenuItem
              key={col.id}
              onClick={(e) => {
                e.stopPropagation();
                handleSave(col.id, col.name);
              }}
              disabled={saving === col.id}
            >
              {saving === col.id ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Folder className="h-4 w-4 mr-2 text-primary" />
              )}
              <span className="truncate">{col.name}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {col.items_count}
              </span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SaveToFolderButton;
