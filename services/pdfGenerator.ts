import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Budget, Client, formatCurrency, CalculationType } from '../types';

interface ImageData {
  data: string;
  width: number;
  height: number;
}

// Helper to load image from URL to Base64 (handles simple cases, might need CORS config on server)
const getDataUri = (url: string): Promise<ImageData> => {
  return new Promise((resolve) => {
    const image = new Image();
    image.setAttribute('crossOrigin', 'anonymous'); // Try to handle CORS
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(image, 0, 0);
      resolve({
        data: canvas.toDataURL('image/png'),
        width: image.naturalWidth,
        height: image.naturalHeight
      });
    };
    image.onerror = () => {
      // Fallback if CORS fails or image not found
      resolve({ data: '', width: 0, height: 0 });
    };
    // Use proxy to ensure we can download the image inside the browser
    image.src = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
  });
};

export const generateBudgetPDF = async (budget: Budget, client: Client) => {
  const doc = new jsPDF();
  
  // Colors
  const darkGray: [number, number, number] = [84, 89, 95];   // #54595F (Header Background)
  const orange: [number, number, number] = [240, 135, 54];   // #F08736 (Highlights)
  const lightGray: [number, number, number] = [245, 245, 245]; // Table Alternates

  // Set Global Font to Helvetica (Standard Clean Sans-Serif similar to Roboto in PDF context)
  doc.setFont('helvetica');

  // --- 1. FULL WIDTH HEADER BAR ---
  // Draw dark rectangle across the top (0 to 210mm width, 40mm height)
  doc.setFillColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.rect(0, 0, 210, 40, 'F');

  // --- 2. LOGO & COMPANY INFO (LEFT SIDE) ---
  const logoUrl = 'https://metalapex.com.br/wp-content/uploads/2025/07/Logo-metal-apex-branca-h-1.png';
  const logoData = await getDataUri(logoUrl);

  // Logo Logic
  if (logoData.data) {
    // Define max dimensions for the logo area (smaller to fit text below)
    const maxW = 60;
    const maxH = 15; 
    
    // Calculate aspect ratio to prevent stretching
    const ratio = Math.min(maxW / logoData.width, maxH / logoData.height);
    const w = logoData.width * ratio;
    const h = logoData.height * ratio;

    // Position logo slightly higher (y=7)
    doc.addImage(logoData.data, 'PNG', 14, 7, w, h); 
  } else {
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text('METAL APEX', 14, 15);
  }

  // Company Info (Inside Header, below Logo)
  doc.setTextColor(255, 255, 255); // White text
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  
  // Adjust Y based on where logo ends, approx Y=25
  doc.text('Metal Apex - Uma divisão Projemix Sistemas Ltda', 14, 28);
  doc.text('CNPJ: 53.210.488/0001-48  |  Tel/WhatsApp: (41) 99617-0545', 14, 33);


  // --- 3. BUDGET HEADER INFO (RIGHT SIDE) ---
  // "ORÇAMENTO" Label
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('ORÇAMENTO Nº', 196, 15, { align: 'right' });
  
  // The Number
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(budget.number, 196, 22, { align: 'right' });

  // Dates
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Emissão: ${new Date(budget.createdAt).toLocaleDateString('pt-BR')}`, 196, 30, { align: 'right' });
  doc.text(`Validade: ${new Date(budget.validUntil).toLocaleDateString('pt-BR')}`, 196, 35, { align: 'right' });

  // --- 4. CLIENT INFO SECTION ---
  // Moved up since company info is now in header
  const clientY = 55; 
  
  // Section Title
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(orange[0], orange[1], orange[2]);
  doc.text('DADOS DO CLIENTE', 14, clientY);
  
  // Divider Line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(14, clientY + 2, 196, clientY + 2);

  // Client Details
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(10);
  
  // Column 1
  doc.text(`Cliente:`, 14, clientY + 8);
  doc.setFont('helvetica', 'bold');
  doc.text(client.name, 30, clientY + 8);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Doc:`, 14, clientY + 13);
  doc.text(client.document || 'N/A', 30, clientY + 13);

  // Column 2 (Offset X)
  const col2X = 110;
  
  // Contact Info (Split lines)
  doc.text(`Tel:`, col2X, clientY + 8);
  doc.text(client.phone, col2X + 18, clientY + 8);
  
  doc.text(`Email:`, col2X, clientY + 13);
  // Prevent email overflow
  const emailWidth = 75; // Available width for email
  const splitEmail = doc.splitTextToSize(client.email, emailWidth);
  doc.text(splitEmail, col2X + 18, clientY + 13);

  // Address (Handle multiline)
  // Calculate Y position based on email height (in case it wrapped)
  const addressY = clientY + 13 + (splitEmail.length * 4) + 1; 
  
  doc.text(`Endereço:`, col2X, addressY);
  const addressText = `${client.address.street}, ${client.address.number} - ${client.address.city}/${client.address.state}`;
  const splitAddress = doc.splitTextToSize(addressText, emailWidth);
  doc.text(splitAddress, col2X + 18, addressY);

  // --- 6. ITEMS TABLE ---
  const tableBody = budget.items.map(item => {
    let measures = '';
    if (item.calculationType === CalculationType.M2) {
      measures = `${item.width}m x ${item.height}m (${(item.width * item.height).toFixed(2)}m²)`;
    } else if (item.calculationType === CalculationType.LINEAR) {
      measures = `${item.width}m (Linear)`;
    } else {
      measures = 'Unid.';
    }

    return [
      item.name + (item.description ? `\n${item.description}` : ''),
      measures,
      item.quantity,
      formatCurrency(item.unitPrice),
      formatCurrency(item.total)
    ];
  });

  autoTable(doc, {
    startY: addressY + (splitAddress.length * 5) + 10, // Dynamic start Y
    head: [['Item / Descrição', 'Medidas', 'Qtd', 'Vl. Unit', 'Total']],
    body: tableBody,
    theme: 'grid',
    headStyles: { 
      fillColor: orange, // ORANGE HEADER
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'left'
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { halign: 'center' },
      2: { halign: 'center' },
      3: { halign: 'right' },
      4: { halign: 'right', fontStyle: 'bold' }
    },
    styles: {
      font: 'helvetica',
      fontSize: 9,
      lineColor: [230, 230, 230],
      cellPadding: 4
    },
    alternateRowStyles: {
      fillColor: lightGray
    }
  });

  // --- 7. TOTALS SECTION ---
  // @ts-ignore
  const finalY = doc.lastAutoTable.finalY + 10;
  
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  
  const labelX = 140;
  const valueX = 196;
  let currentY = finalY;

  // Subtotals removed

  // Conditional Freight
  if (budget.freight > 0) {
    doc.text(`Frete:`, labelX, currentY);
    doc.text(formatCurrency(budget.freight), valueX, currentY, { align: 'right' });
    currentY += 5;
  }
  
  // Conditional Installation
  if (budget.installation > 0) {
    doc.text(`Instalação:`, labelX, currentY);
    doc.text(formatCurrency(budget.installation), valueX, currentY, { align: 'right' });
    currentY += 5;
  }

  // Conditional Discount
  if (budget.discount > 0) {
    doc.setTextColor(220, 50, 50); // Red
    doc.text(`Desconto:`, labelX, currentY);
    doc.text(`- ${formatCurrency(budget.discount)}`, valueX, currentY, { align: 'right' });
    currentY += 5;
  }

  // Total Box
  const totalY = currentY + 5;
  doc.setFillColor(orange[0], orange[1], orange[2]);
  doc.rect(130, totalY, 66, 12, 'F');
  
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text(`TOTAL:`, 135, totalY + 8);
  doc.text(formatCurrency(budget.total), 193, totalY + 8, { align: 'right' });
  
  // --- 8. CONDITIONS & DIVISIONS ---
  // Reset Font
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);

  const conditionsStart = totalY + 20;
  
  // Background box for conditions
  doc.setFillColor(250, 250, 250);
  doc.setDrawColor(220, 220, 220);
  doc.rect(14, conditionsStart, 182, 50, 'FD');

  // Title
  doc.setFillColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.rect(14, conditionsStart, 182, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('CONDIÇÕES E PRAZOS', 18, conditionsStart + 5.5);

  // Content
  doc.setTextColor(60, 60, 60);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  // Payment
  let cursorY = conditionsStart + 14;
  doc.setFont('helvetica', 'bold');
  doc.text('Forma de Pagamento:', 18, cursorY);
  doc.setFont('helvetica', 'normal');
  doc.text(budget.paymentConditions, 60, cursorY);
  
  // Divider
  cursorY += 4;
  doc.setDrawColor(230, 230, 230);
  doc.line(18, cursorY, 190, cursorY);

  // Execution
  cursorY += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Prazo de Execução:', 18, cursorY);
  doc.setFont('helvetica', 'normal');
  doc.text(budget.executionTerm, 60, cursorY);

  // Divider
  cursorY += 4;
  doc.line(18, cursorY, 190, cursorY);

  // Notes
  if (budget.notes) {
    cursorY += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Observações:', 18, cursorY);
    doc.setFont('helvetica', 'normal');
    
    // Split long text
    const splitNotes = doc.splitTextToSize(budget.notes, 120);
    doc.text(splitNotes, 60, cursorY);
  }

  // --- FOOTER ---
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text('www.metalapex.com.br', 105, pageHeight - 10, { align: 'center' });
  doc.text(`Gerado em: ${new Date().toLocaleString()}`, 196, pageHeight - 10, { align: 'right' });

  doc.save(`Orcamento_${budget.number}.pdf`);
};
