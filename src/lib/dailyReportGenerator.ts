import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { Order } from './firebase';

interface DailyReportData {
  date: string;
  totalRevenue: number;
  totalCashSales: number;
  totalCardSales: number;
  totalOrders: number;
  totalItemsSold: number;
  taxCollected: number;
  netSales: number;
  orders: Order[];
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  categoryBreakdown: Array<{ category: string; revenue: number }>;
  staffPerformance: Array<{ staff: string; orders: number; revenue: number }>;
}

export const generateDailyReportPDF = (reportData: DailyReportData, currencySymbol: string = 'AED'): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFillColor(199, 169, 86); // Gold color
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.text('FUDE Studio Dubai', pageWidth / 2, 15, { align: 'center' });
  
  doc.setFontSize(18);
  doc.text('End of Day Report', pageWidth / 2, 28, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text(format(new Date(reportData.date), 'EEEE, MMMM dd, yyyy'), pageWidth / 2, 38, { align: 'center' });
  
  let yPos = 55;
  
  // Executive Summary Box
  doc.setFillColor(248, 241, 216); // Light gold
  doc.roundedRect(14, yPos, pageWidth - 28, 85, 3, 3, 'F');
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Executive Summary', 20, yPos + 10);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const summaryData = [
    ['Total Revenue:', `${currencySymbol} ${reportData.totalRevenue.toFixed(2)}`, 'Total Orders:', reportData.totalOrders.toString()],
    ['Cash Sales:', `${currencySymbol} ${reportData.totalCashSales.toFixed(2)}`, 'Items Sold:', reportData.totalItemsSold.toString()],
    ['Card Sales:', `${currencySymbol} ${reportData.totalCardSales.toFixed(2)}`, 'Tax Collected:', `${currencySymbol} ${reportData.taxCollected.toFixed(2)}`],
    ['Net Sales:', `${currencySymbol} ${reportData.netSales.toFixed(2)}`, '', ''],
  ];
  
  let summaryY = yPos + 20;
  summaryData.forEach(row => {
    doc.setFont('helvetica', 'bold');
    doc.text(row[0], 20, summaryY);
    doc.setFont('helvetica', 'normal');
    doc.text(row[1], 70, summaryY);
    
    if (row[2]) {
      doc.setFont('helvetica', 'bold');
      doc.text(row[2], 120, summaryY);
      doc.setFont('helvetica', 'normal');
      doc.text(row[3], 160, summaryY);
    }
    summaryY += 8;
  });
  
  yPos = 150;
  
  // Sales by Payment Method Chart
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Payment Methods Breakdown', 14, yPos);
  
  const paymentData = [
    ['Payment Method', 'Amount', 'Percentage'],
    [
      'Cash',
      `${currencySymbol} ${reportData.totalCashSales.toFixed(2)}`,
      `${((reportData.totalCashSales / reportData.totalRevenue) * 100).toFixed(1)}%`
    ],
    [
      'Card',
      `${currencySymbol} ${reportData.totalCardSales.toFixed(2)}`,
      `${((reportData.totalCardSales / reportData.totalRevenue) * 100).toFixed(1)}%`
    ],
  ];
  
  autoTable(doc, {
    startY: yPos + 5,
    head: [paymentData[0]],
    body: paymentData.slice(1),
    theme: 'striped',
    headStyles: {
      fillColor: [199, 169, 86],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right', fontStyle: 'bold' }
    }
  });
  
  // Top Products
  if (reportData.topProducts.length > 0) {
    const finalY = (doc as any).lastAutoTable.finalY || yPos + 40;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Top Selling Products', 14, finalY + 15);
    
    const topProductsData = reportData.topProducts.map((product, index) => [
      (index + 1).toString(),
      product.name,
      product.quantity.toString(),
      `${currencySymbol} ${product.revenue.toFixed(2)}`
    ]);
    
    autoTable(doc, {
      startY: finalY + 20,
      head: [['#', 'Product', 'Qty Sold', 'Revenue']],
      body: topProductsData,
      theme: 'grid',
      headStyles: {
        fillColor: [199, 169, 86],
        textColor: [255, 255, 255]
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'right', fontStyle: 'bold' }
      }
    });
  }
  
  // Add new page for detailed transactions
  doc.addPage();
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Transaction Details', 14, 20);
  
  if (reportData.orders.length > 0) {
    const transactionData = reportData.orders.map((order, index) => [
      (index + 1).toString(),
      format(new Date(order.created_at), 'hh:mm a'),
      order.staff_name || 'N/A',
      order.payment_mode,
      order.payment_status,
      `${currencySymbol} ${order.total.toFixed(2)}`
    ]);
    
    autoTable(doc, {
      startY: 25,
      head: [['#', 'Time', 'Staff', 'Payment', 'Status', 'Amount']],
      body: transactionData,
      theme: 'grid',
      headStyles: {
        fillColor: [199, 169, 86],
        textColor: [255, 255, 255],
        fontSize: 9
      },
      styles: {
        fontSize: 8,
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 25 },
        2: { cellWidth: 30 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
        5: { halign: 'right', fontStyle: 'bold', cellWidth: 30 }
      }
    });
  }
  
  // Staff Performance
  if (reportData.staffPerformance.length > 0) {
    const finalY = (doc as any).lastAutoTable.finalY || 100;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Staff Performance', 14, finalY + 15);
    
    const staffData = reportData.staffPerformance.map(staff => [
      staff.staff,
      staff.orders.toString(),
      `${currencySymbol} ${staff.revenue.toFixed(2)}`,
      `${currencySymbol} ${(staff.revenue / staff.orders).toFixed(2)}`
    ]);
    
    autoTable(doc, {
      startY: finalY + 20,
      head: [['Staff Member', 'Orders', 'Total Sales', 'Avg Order']],
      body: staffData,
      theme: 'striped',
      headStyles: {
        fillColor: [199, 169, 86],
        textColor: [255, 255, 255]
      },
      columnStyles: {
        1: { halign: 'center' },
        2: { halign: 'right', fontStyle: 'bold' },
        3: { halign: 'right' }
      }
    });
  }
  
  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Generated: ${format(new Date(), 'MMM dd, yyyy hh:mm a')} | Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
    
    doc.text(
      '© 2025 FUDE Studio Dubai - Confidential',
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 5,
      { align: 'center' }
    );
  }
  
  // Save PDF
  const filename = `EOD_Report_${format(new Date(reportData.date), 'yyyy-MM-dd')}.pdf`;
  doc.save(filename);
};
