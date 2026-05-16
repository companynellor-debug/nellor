import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Table2, Link2, Clock, CheckCircle2, XCircle, Loader2, History, ChevronDown, ChevronUp, Package } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const BACKEND_URL = (import.meta.env.REACT_APP_BACKEND_URL || "").replace(/\/$/, "");

interface Import {
  id: string;
  import_type: string;
  source_file_url?: string;
  source_url?: string;
  status: string;
  products_found: number;
  products_imported: number;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

interface Props {
  supplierId: string;
}

const statusConfig: Record<string, { label: string; icon: any; cls: string }> = {
  processing: { label: "Processando", icon: Loader2, cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  review: { label: "Em revisão", icon: Clock, cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  completed: { label: "Concluída", icon: CheckCircle2, cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
  failed: { label: "Falhou", icon: XCircle, cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
};

const typeIcons: Record<string, any> = {
  pdf: FileText,
  spreadsheet: Table2,
  url: Link2,
};

const typeLabels: Record<string, string> = {
  pdf: "PDF",
  spreadsheet: "Planilha",
  url: "URL",
};

export default function ImportHistory({ supplierId }: Props) {
  const [imports, setImports] = useState<Import[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (supplierId) fetchImports();
  }, [supplierId]);

  const fetchImports = async () => {
    try {
      const resp = await fetch(`${BACKEND_URL}/api/catalog/imports/${supplierId}`);
      const data = await resp.json();
      setImports(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  if (loading || imports.length === 0) return null;

  return (
    <Card className="mt-4 overflow-hidden">
      <button
        className="w-full p-3 flex items-center gap-2 hover:bg-muted/50 transition-colors text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <History className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">Importações Anteriores</span>
        <Badge variant="secondary" className="text-[10px] ml-1">{imports.length}</Badge>
        <span className="ml-auto">
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-border divide-y divide-border">
          {imports.map((imp) => {
            const status = statusConfig[imp.status] || statusConfig.processing;
            const TypeIcon = typeIcons[imp.import_type] || FileText;
            const StatusIcon = status.icon;

            return (
              <div key={imp.id} className="p-3 flex items-center gap-3">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                  imp.import_type === "pdf" ? "bg-red-100 dark:bg-red-900/20" :
                  imp.import_type === "spreadsheet" ? "bg-green-100 dark:bg-green-900/20" :
                  "bg-blue-100 dark:bg-blue-900/20"
                }`}>
                  <TypeIcon className={`h-4 w-4 ${
                    imp.import_type === "pdf" ? "text-red-600" :
                    imp.import_type === "spreadsheet" ? "text-green-600" : "text-blue-600"
                  }`} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {typeLabels[imp.import_type] || imp.import_type}
                    {imp.source_file_url && <span className="text-muted-foreground ml-1">— {imp.source_file_url}</span>}
                    {imp.source_url && <span className="text-muted-foreground ml-1 text-xs">— {imp.source_url.substring(0, 40)}...</span>}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(imp.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </span>
                    <span className="text-[10px] text-muted-foreground">•</span>
                    <span className="text-[10px] text-muted-foreground">
                      {imp.products_found} encontrados · {imp.products_imported} importados
                    </span>
                  </div>
                </div>

                <Badge className={`shrink-0 text-[10px] gap-1 ${status.cls}`}>
                  <StatusIcon className={`h-3 w-3 ${imp.status === "processing" ? "animate-spin" : ""}`} />
                  {status.label}
                </Badge>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
