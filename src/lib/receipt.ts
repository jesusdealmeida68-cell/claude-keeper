import { jsPDF } from "jspdf";

type ReceiptData = {
  id: string;
  full_name: string;
  phone: string;
  amount: number;
  method: "phone" | "iban";
  destination: string | null;
  created_at: string;
  paid_at: string | null;
};

/** Gera e descarrega o PDF de comprovativo de uma retirada já paga. */
export function downloadWithdrawalReceipt(w: ReceiptData) {
  const doc = new jsPDF({ unit: "mm", format: "a5" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;

  // Cabeçalho
  doc.setFillColor(20, 40, 110);
  doc.rect(0, 0, pageWidth, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Pioneer", margin, 14);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Comprovativo de Retirada", margin, 21);

  let y = 40;
  doc.setTextColor(30, 30, 30);

  const row = (label: string, value: string) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(110, 110, 110);
    doc.text(label, margin, y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(20, 20, 20);
    doc.text(value, margin, y + 6);
    y += 16;
  };

  row("Referência", w.id.slice(0, 8).toUpperCase());
  row("Utilizador", w.full_name);
  row("Telefone", w.phone);
  row("Valor pago", `${Number(w.amount).toLocaleString("pt-AO", { minimumFractionDigits: 2 })} Kz`);
  row(w.method === "iban" ? "IBAN de destino" : "Telefone de destino", w.destination ?? "—");
  row("Data do pedido", new Date(w.created_at).toLocaleString("pt-AO"));
  row("Data do pagamento", w.paid_at ? new Date(w.paid_at).toLocaleString("pt-AO") : "—");

  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  doc.text("Documento gerado automaticamente pelo Pioneer.", margin, y);

  doc.save(`comprovativo-retirada-${w.id.slice(0, 8)}.pdf`);
}
