import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  FileText, Table2, Link2, Upload, X, Loader2, Download,
  ArrowLeft, Sparkles, AlertTriangle, GripVertical,
} from "lucide-react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import ImportPreview from "./ImportPreview";

const BACKEND_URL = (import.meta.env.REACT_APP_BACKEND_URL || "").replace(/\/$/, "");

type ImportType = "pdf" | "spreadsheet" | "url" | null;
type ImportStep = "choose" | "upload" | "processing" | "preview";

interface ImportResult {
  import_id: string;
  status: string;
  products_found: number;
  error?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

const PROCESSING_MESSAGES = [
  "Lendo seu catálogo...",
  "Identificando produtos...",
  "Organizando informações...",
  "Analisando dados com IA...",
  "Estruturando resultados...",
];

export default function ImportCatalogModal({ open, onOpenChange, onImportComplete }: Props) {
  const { user } = useSupabaseAuth();
  const [step, setStep] = useState<ImportStep>("choose");
  const [importType, setImportType] = useState<ImportType>(null);
  const [file, setFile] = useState<File | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processingMsg, setProcessingMsg] = useState("");
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const reset = () => {
    setStep("choose");
    setImportType(null);
    setFile(null);
    setUrlInput("");
    setLoading(false);
    setProgress(0);
    setProcessingMsg("");
    setImportResult(null);
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const selectType = (type: ImportType) => {
    setImportType(type);
    setStep("upload");
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) setFile(droppedFile);
  }, []);

  const animateProcessing = () => {
    let idx = 0;
    setProgress(0);
    setProcessingMsg(PROCESSING_MESSAGES[0]);
    const interval = setInterval(() => {
      idx++;
      if (idx < PROCESSING_MESSAGES.length) {
        setProcessingMsg(PROCESSING_MESSAGES[idx]);
        setProgress(Math.min(90, (idx / PROCESSING_MESSAGES.length) * 100));
      }
    }, 3000);
    return () => clearInterval(interval);
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      toast.error("Faça login primeiro");
      return;
    }

    setStep("processing");
    setLoading(true);
    const stopAnim = animateProcessing();

    try {
      let result: ImportResult;

      if (importType === "url") {
        const formData = new FormData();
        formData.append("supplier_id", user.id);
        formData.append("url", urlInput);

        const resp = await fetch(`${BACKEND_URL}/api/catalog/import/url`, {
          method: "POST",
          body: formData,
        });
        result = await resp.json();
      } else {
        if (!file) throw new Error("Selecione um arquivo");
        const formData = new FormData();
        formData.append("file", file);
        formData.append("supplier_id", user.id);

        const endpoint = importType === "pdf"
          ? `${BACKEND_URL}/api/catalog/import/pdf`
          : `${BACKEND_URL}/api/catalog/import/spreadsheet`;

        const resp = await fetch(endpoint, {
          method: "POST",
          body: formData,
        });
        result = await resp.json();
      }

      stopAnim();
      setProgress(100);
      setImportResult(result);

      if (result.status === "review") {
        setStep("preview");
        toast.success(`${result.products_found} produtos encontrados!`);
      } else {
        toast.error(result.error || "Falha na importação");
        setStep("upload");
      }
    } catch (err: any) {
      stopAnim();
      toast.error(err.message || "Erro na importação");
      setStep("upload");
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    window.open(`${BACKEND_URL}/api/catalog/template`, '_blank');
  };

  // ──── Render ────

  if (step === "preview" && importResult) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <ImportPreview
            importId={importResult.import_id}
            productsFound={importResult.products_found}
            supplierId={user?.id || ""}
            onBack={() => setStep("upload")}
            onComplete={() => {
              handleClose();
              onImportComplete();
            }}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Importar Catálogo Inteligente
          </DialogTitle>
        </DialogHeader>

        {/* Step: Choose Type */}
        {step === "choose" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Escolha como deseja importar seus produtos:</p>

            <Card
              className="p-4 cursor-pointer hover:border-red-400 hover:shadow-md transition-all group"
              onClick={() => selectType("pdf")}
            >
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="font-semibold text-foreground group-hover:text-red-600 transition-colors">Catálogo em PDF</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Faça upload do seu catálogo em PDF. Nossa IA extrai os produtos automaticamente.</p>
                </div>
              </div>
            </Card>

            <Card
              className="p-4 cursor-pointer hover:border-green-400 hover:shadow-md transition-all group"
              onClick={() => selectType("spreadsheet")}
            >
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                  <Table2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-foreground group-hover:text-green-600 transition-colors">Planilha Excel ou CSV</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Importe uma planilha com seus produtos. Suporta .xlsx, .xls e .csv.</p>
                </div>
              </div>
            </Card>

            <Card
              className="p-4 cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group"
              onClick={() => selectType("url")}
            >
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                  <Link2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-foreground group-hover:text-blue-600 transition-colors">Site ou Página de Produto</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Cole o link do seu site ou página de produto. Nossa IA extrai as informações.</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Step: Upload */}
        {step === "upload" && (
          <div className="space-y-4">
            <Button variant="ghost" size="sm" onClick={() => { setStep("choose"); setFile(null); setUrlInput(""); }} className="gap-1 -ml-2">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Button>

            {importType === "url" ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Cole o link do site ou página de produto:</p>
                <Input
                  placeholder="https://www.exemplo.com/produtos"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                />
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Funciona melhor em páginas de produto individuais ou sites com listagem clara de produtos.
                  </p>
                </div>
                <Button
                  className="w-full"
                  disabled={!urlInput.trim() || loading}
                  onClick={handleSubmit}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Analisar com IA
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {importType === "spreadsheet" && (
                  <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-1">
                    <Download className="h-3.5 w-3.5" />
                    Baixar template
                  </Button>
                )}

                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                    dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/30"
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                >
                  {file ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileText className="h-8 w-8 text-primary" />
                      <div className="text-left">
                        <p className="font-medium text-sm">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setFile(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-sm text-muted-foreground">
                        Arraste e solte o arquivo aqui ou
                      </p>
                      <label className="inline-block mt-2">
                        <input
                          type="file"
                          className="hidden"
                          accept={importType === "pdf" ? ".pdf" : ".xlsx,.xls,.csv"}
                          onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
                        />
                        <span className="text-sm font-medium text-primary hover:underline cursor-pointer">
                          clique para selecionar
                        </span>
                      </label>
                      <p className="text-xs text-muted-foreground mt-2">
                        {importType === "pdf" ? "Apenas .pdf (máx 10MB)" : ".xlsx, .xls ou .csv (máx 10MB)"}
                      </p>
                    </div>
                  )}
                </div>

                <Button
                  className="w-full"
                  disabled={!file || loading}
                  onClick={handleSubmit}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Analisar com IA
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step: Processing */}
        {step === "processing" && (
          <div className="py-8 space-y-6 text-center">
            <div className="relative mx-auto w-16 h-16">
              <Loader2 className="h-16 w-16 animate-spin text-primary/30" />
              <Sparkles className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">{processingMsg}</p>
              <p className="text-xs text-muted-foreground mt-1">Isso pode levar alguns segundos...</p>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
