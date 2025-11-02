import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { StaffSalesReport } from './salesTracking';

export const generateStaffSalesPDF = (report: StaffSalesReport, currencySymbol: string = 'AED'): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFillColor(199, 169, 86); // Gold color
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('FUDE Studio Dubai', pageWidth / 2, 15, { align: 'center' });
  
  doc.setFontSize(16);
  doc.text('Staff Sales Report', pageWidth / 2, 28, { align: 'center' });
  
  // Staff Info
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Staff Information', 14, 50);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Name: ${report.staffName}`, 14, 58);
  doc.text(`Email: ${report.staffEmail}`, 14, 64);
  doc.text(`Session Start: ${format(new Date(report.sessionStart), 'MMM dd, yyyy hh:mm a')}`, 14, 70);
  doc.text(`Session End: ${format(new Date(report.sessionEnd), 'MMM dd, yyyy hh:mm a')}`, 14, 76);
  
  // Summary Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Sales Summary', 14, 90);
  
  // Summary box
  const summaryData = [
    ['Total Cash Sales', `${currencySymbol} ${report.totalCashSales.toFixed(2)}`],
    ['Total Card Sales', `${currencySymbol} ${report.totalCardSales.toFixed(2)}`],
    ['Total Transactions', `${report.totalTransactions}`],
    ['Tax Collected', `${currencySymbol} ${report.taxCollected.toFixed(2)}`],
    ['Net Sales (Before Tax)', `${currencySymbol} ${report.netSales.toFixed(2)}`],
    ['Gross Sales (Total)', `${currencySymbol} ${report.grossSales.toFixed(2)}`],
  ];
  
  autoTable(doc, {
    startY: 95,
    head: [['Description', 'Amount']],
    body: summaryData,
    theme: 'striped',
    headStyles: { 
      fillColor: [199, 169, 86],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 100 },
      1: { halign: 'right', fontStyle: 'bold' }
    },
    styles: {
      fontSize: 10,
      cellPadding: 5
    }
  });
  
  // Transactions Detail
  if (report.sales.length > 0) {
    const finalY = (doc as any).lastAutoTable.finalY || 150;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Transaction Details', 14, finalY + 10);
    
    const transactionData = report.sales.map((sale, index) => [
      `${index + 1}`,
      format(new Date(sale.timestamp), 'MMM dd, hh:mm a'),
      `#${sale.orderId.slice(-6)}`,
      sale.paymentMode,
      `${currencySymbol} ${sale.subtotal.toFixed(2)}`,
      `${currencySymbol} ${sale.tax.toFixed(2)}`,
      `${currencySymbol} ${sale.total.toFixed(2)}`
    ]);
    
    autoTable(doc, {
      startY: finalY + 15,
      head: [['#', 'Date/Time', 'Order ID', 'Payment', 'Subtotal', 'Tax', 'Total']],
      body: transactionData,
      theme: 'grid',
      headStyles: { 
        fillColor: [199, 169, 86],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      styles: {
        fontSize: 8,
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 35 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
        4: { halign: 'right', cellWidth: 25 },
        5: { halign: 'right', cellWidth: 25 },
        6: { halign: 'right', cellWidth: 25, fontStyle: 'bold' }
      }
    });
  }
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Generated on ${format(new Date(), 'MMM dd, yyyy hh:mm a')} | Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
  
  // Save PDF
  const filename = `Staff_Sales_${report.staffName.replace(/\s/g, '_')}_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`;
  doc.save(filename);
};
