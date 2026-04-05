import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface StoreInfo {
  storeName: string;
  bio: string;
  avatar: string;
  banner: string;
  whatsapp?: string;
  address?: string;
}

interface CatalogoPDFButtonProps {
  storeInfo: StoreInfo;
  products: Array<{
    id: string;
    name?: string;
    nome?: string;
    price?: number;
    preco?: number;
    images?: string[];
    imagens?: string[] | null;
    description?: string;
    descricao_curta?: string | null;
    stock?: number;
    estoque?: number;
  }>;
}

const CatalogoPDFButton = ({ storeInfo, products }: CatalogoPDFButtonProps) => {
  const [loading, setLoading] = useState(false);

  const generatePDF = async () => {
    setLoading(true);
    toast("Gerando catálogo...");
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: html2canvas } = await import("html2canvas");

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const W = 210;
      const H = 297;

      const loadImage = (url: string): Promise<HTMLImageElement> =>
        new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = () => resolve(img);
          img.src = url;
        });

      const imgToBase64 = async (url: string): Promise<string | null> => {
        try {
          const img = await loadImage(url);
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth || 400;
          canvas.height = img.naturalHeight || 400;
          const ctx = canvas.getContext("2d");
          if (!ctx) return null;
          ctx.drawImage(img, 0, 0);
          return canvas.toDataURL("image/jpeg", 0.8);
        } catch {
          return null;
        }
      };

      // ============================
      // CAPA
      // ============================
      // Banner
      const bannerData = await imgToBase64(storeInfo.banner);
      if (bannerData) {
        doc.addImage(bannerData, "JPEG", 0, 0, W, 70);
      } else {
        doc.setFillColor(59, 130, 246);
        doc.rect(0, 0, W, 70, "F");
      }

      // Overlay gradient
      doc.setFillColor(0, 0, 0);
      doc.setGState(new (doc as any).GState({ opacity: 0.4 }));
      doc.rect(0, 0, W, 70, "F");
      doc.setGState(new (doc as any).GState({ opacity: 1 }));

      // Avatar circle
      const avatarData = await imgToBase64(storeInfo.avatar);
      const avatarX = 20;
      const avatarY = 45;
      const avatarR = 18;
      if (avatarData) {
        // White circle border
        doc.setFillColor(255, 255, 255);
        doc.circle(avatarX + avatarR, avatarY + avatarR, avatarR + 1.5, "F");
        doc.addImage(avatarData, "JPEG", avatarX, avatarY, avatarR * 2, avatarR * 2);
      }

      // Store name
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text(storeInfo.storeName || "Minha Loja", 60, 60);

      // Bio
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      const bioLines = doc.splitTextToSize(storeInfo.bio || "", W - 40);
      doc.text(bioLines.slice(0, 3), 20, 88);

      // Contact info
      let contactY = 98;
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      if (storeInfo.whatsapp) {
        doc.text(`📱 ${storeInfo.whatsapp}`, 20, contactY);
        contactY += 6;
      }
      if (storeInfo.address) {
        doc.text(`📍 ${storeInfo.address}`, 20, contactY);
        contactY += 6;
      }
      doc.text(`📅 Gerado em ${format(new Date(), "dd/MM/yyyy", { locale: ptBR })}`, 20, contactY);

      // Divider
      doc.setDrawColor(220, 220, 220);
      doc.line(20, contactY + 6, W - 20, contactY + 6);

      // Products section title
      doc.setFontSize(14);
      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "bold");
      doc.text("Nossos Produtos", 20, contactY + 16);

      // ============================
      // PRODUTOS — 2 colunas por página
      // ============================
      // Normalize products to support both Portuguese and English field names
      const normalizedProducts = products.map(p => ({
        id: p.id,
        nome: p.nome || p.name || '',
        preco: p.preco ?? p.price ?? 0,
        imagens: p.imagens || p.images || [],
        descricao_curta: p.descricao_curta || p.description || '',
        estoque: p.estoque ?? p.stock ?? 0,
      }));
      
      const activeProducts = normalizedProducts.filter((p) => p.estoque > 0);
      const cols = 2;
      const cardW = (W - 20 - (cols - 1) * 6 - 20) / cols; // ~82mm
      const cardH = 75;
      const startY = contactY + 22;
      let curX = 20;
      let curY = startY;
      let itemsOnPage = 0;
      const maxPerPage = Math.floor((H - 20 - startY) / (cardH + 6)) * cols;

      for (let i = 0; i < activeProducts.length; i++) {
        const p = activeProducts[i];

        // New page check
        if (i > 0 && i % maxPerPage === 0) {
          addFooter(doc, W, H, storeInfo.storeName);
          doc.addPage();
          curX = 20;
          curY = 20;
          itemsOnPage = 0;
        }

        const col = itemsOnPage % cols;
        if (col === 0) curX = 20;
        else curX = 20 + col * (cardW + 6);

        // Card background
        doc.setFillColor(248, 248, 248);
        doc.roundedRect(curX, curY, cardW, cardH, 3, 3, "F");

        // Product image
        const imgData = p.imagens?.[0] ? await imgToBase64(p.imagens[0]) : null;
        if (imgData) {
          doc.addImage(imgData, "JPEG", curX + 2, curY + 2, cardW - 4, 40);
        } else {
          doc.setFillColor(200, 200, 200);
          doc.rect(curX + 2, curY + 2, cardW - 4, 40, "F");
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text("Sem imagem", curX + cardW / 2, curY + 22, { align: "center" });
        }

        // Product name
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 30, 30);
        const nameLines = doc.splitTextToSize(p.nome, cardW - 4);
        doc.text(nameLines.slice(0, 2), curX + 2, curY + 47);

        // Price
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(59, 130, 246);
        doc.text(
          `R$ ${Number(p.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          curX + 2,
          curY + 57
        );

        // Description
        if (p.descricao_curta) {
          doc.setFontSize(6.5);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(100, 100, 100);
          const descLines = doc.splitTextToSize(p.descricao_curta, cardW - 4);
          doc.text(descLines.slice(0, 2), curX + 2, curY + 64);
        }

        // Move position
        itemsOnPage++;
        if (itemsOnPage % cols === 0) {
          curY += cardH + 6;
        }
      }

      addFooter(doc, W, H, storeInfo.storeName);

      // Save
      const fileName = `catalogo-${(storeInfo.storeName || "loja")
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")}.pdf`;
      doc.save(fileName);
      toast.success(`Catálogo baixado: ${fileName}`);
    } catch (err) {
      console.error("PDF error:", err);
      toast.error("Erro ao gerar catálogo. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={generatePDF}
      disabled={loading}
      variant="outline"
      className="gap-2 border-primary text-primary hover:bg-primary/5"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4" />
      )}
      {loading ? "Gerando PDF..." : "Gerar Catálogo PDF"}
    </Button>
  );
};

function addFooter(doc: any, W: number, H: number, storeName: string) {
  doc.setDrawColor(220, 220, 220);
  doc.line(20, H - 14, W - 20, H - 14);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(150, 150, 150);
  doc.text("Powered by Nellor • nellor.lovable.app", W / 2, H - 8, { align: "center" });
  doc.text(storeName, 20, H - 8);
}

export default CatalogoPDFButton;
