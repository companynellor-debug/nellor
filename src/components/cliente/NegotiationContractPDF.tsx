import jsPDF from 'jspdf';
import { toast } from 'sonner';

interface ContractData {
  id: string;
  product_name: string;
  quantity: number;
  agreed_price: number;
  payment_method: string;
  expected_delivery: string | null;
  created_at: string;
  buyerName?: string;
  supplierName?: string;
  notes?: string | null;
}

export const generateNegotiationPDF = (data: ContractData) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 25;

    // Header
    doc.setFillColor(88, 28, 135); // purple-900
    doc.rect(0, 0, pageWidth, 45, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('NELLOR', margin, y);
    y += 8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Resumo do Acordo de Negociacao', margin, y);

    // Date on the right
    doc.setFontSize(9);
    const dateStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    doc.text(`Emitido em: ${dateStr}`, pageWidth - margin, y, { align: 'right' });

    y = 55;
    doc.setTextColor(0, 0, 0);

    // Reference
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 18, 3, 3, 'F');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('Referencia da Negociacao', margin + 5, y + 7);
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(`#${data.id.substring(0, 8).toUpperCase()}`, margin + 5, y + 14);
    doc.setFont('helvetica', 'normal');

    y += 28;

    // Parties section
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(88, 28, 135);
    doc.text('Partes Envolvidas', margin, y);
    y += 3;
    doc.setDrawColor(88, 28, 135);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);

    // Buyer
    doc.setFont('helvetica', 'bold');
    doc.text('Comprador:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(data.buyerName || 'Nao identificado', margin + 35, y);
    y += 8;

    // Supplier
    doc.setFont('helvetica', 'bold');
    doc.text('Fornecedor:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(data.supplierName || 'Nao identificado', margin + 35, y);
    y += 15;

    // Product details
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(88, 28, 135);
    doc.text('Detalhes do Acordo', margin, y);
    y += 3;
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);

    const details = [
      ['Produto', data.product_name],
      ['Quantidade', String(data.quantity)],
      ['Valor Acordado', `R$ ${Number(data.agreed_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
      ['Valor Total', `R$ ${(Number(data.agreed_price) * data.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
      ['Forma de Pagamento', data.payment_method],
      ['Prazo de Entrega', data.expected_delivery ? new Date(data.expected_delivery).toLocaleDateString('pt-BR') : 'A combinar'],
      ['Data da Negociacao', new Date(data.created_at).toLocaleDateString('pt-BR')],
    ];

    details.forEach(([label, value], i) => {
      if (i % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, y - 5, pageWidth - margin * 2, 10, 'F');
      }
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}:`, margin + 5, y);
      doc.setFont('helvetica', 'normal');
      doc.text(value, margin + 60, y);
      y += 10;
    });

    if (data.notes) {
      y += 5;
      doc.setFont('helvetica', 'bold');
      doc.text('Observacoes:', margin + 5, y);
      y += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const lines = doc.splitTextToSize(data.notes, pageWidth - margin * 2 - 10);
      doc.text(lines, margin + 5, y);
      y += lines.length * 5 + 5;
    }

    y += 10;

    // Disclaimer
    doc.setFillColor(255, 248, 230);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 30, 3, 3, 'F');
    doc.setDrawColor(230, 180, 50);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 30, 3, 3, 'S');
    doc.setFontSize(8);
    doc.setTextColor(120, 90, 20);
    doc.setFont('helvetica', 'bold');
    doc.text('AVISO IMPORTANTE', margin + 5, y + 7);
    doc.setFont('helvetica', 'normal');
    const disclaimer = 'Este documento e um resumo da intencao de negociacao registrada na plataforma Nellor. A Nellor atua exclusivamente como intermediadora, nao sendo responsavel por falhas na entrega, pagamento ou qualidade dos produtos. O pagamento e a entrega sao realizados diretamente entre as partes.';
    const disclaimerLines = doc.splitTextToSize(disclaimer, pageWidth - margin * 2 - 10);
    doc.text(disclaimerLines, margin + 5, y + 13);

    y += 40;

    // Signature lines
    if (y < 240) {
      y = 240;
    }
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    const halfWidth = (pageWidth - margin * 2 - 20) / 2;

    doc.line(margin, y, margin + halfWidth, y);
    doc.line(margin + halfWidth + 20, y, pageWidth - margin, y);

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('Comprador', margin + halfWidth / 2, y + 6, { align: 'center' });
    doc.text('Fornecedor', margin + halfWidth + 20 + halfWidth / 2, y + 6, { align: 'center' });

    // Footer
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text('Documento gerado automaticamente pela plataforma Nellor - nellor.lovable.app', pageWidth / 2, 290, { align: 'center' });

    doc.save(`acordo-nellor-${data.id.substring(0, 8)}.pdf`);
    toast.success('PDF do acordo gerado com sucesso!');
  } catch (error) {
    console.error('Error generating PDF:', error);
    toast.error('Erro ao gerar o PDF');
  }
};
