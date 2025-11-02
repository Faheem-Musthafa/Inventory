import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { Order } from './firebase';

interface SettlementReportData {
  date: string;
  orders: Order[];
  totalCashSales: number;
  totalCardSales: number;
  totalOnlineSales: number;
  totalRevenue: number;
  taxCollected: number;
  netSales: number;
  totalOrders: number;
  cashOrders: number;
  cardOrders: number;
  onlineOrders: number;
  totalItemsSold: number;
  averageOrderValue: number;
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  categoryBreakdown: Array<{ category: string; revenue: number; itemsSold: number }>;
  staffPerformance: Array<{ staff: string; orders: number; revenue: number; averageOrderValue: number }>;
  hourlyBreakdown: Array<{ hour: string; orders: number; revenue: number }>;
}

export function generateSettlementReportPDF(
  reportData: SettlementReportData,
  currencySymbol: string = 'AED'
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header with branding
  doc.setFillColor(199, 169, 86); // Gold color
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('James Cafe', pageWidth / 2, 15, { align: 'center' });
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text('Daily Settlement Report', pageWidth / 2, 25, { align: 'center' });

  // Report date and generation time
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const reportDate = new Date(reportData.date);
  doc.text(`Report Date: ${format(reportDate, 'MMMM dd, yyyy')}`, 14, 45);
  doc.text(`Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, pageWidth - 14, 45, { align: 'right' });

  // Settlement Summary Box
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(14, 55, pageWidth - 28, 65, 3, 3, 'F');
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(199, 169, 86);
  doc.text('Settlement Summary', pageWidth / 2, 65, { align: 'center' });

  // Summary content
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  
  const col1X = 20;
  const col2X = pageWidth / 2 + 10;
  let yPos = 75;

  doc.setFont('helvetica', 'bold');
  doc.text('Total Revenue:', col1X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(`${currencySymbol} ${reportData.totalRevenue.toFixed(2)}`, col1X + 45, yPos);

  doc.setFont('helvetica', 'bold');
  doc.text('Total Orders:', col2X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(`${reportData.totalOrders}`, col2X + 35, yPos);

  yPos += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Net Sales:', col1X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(`${currencySymbol} ${reportData.netSales.toFixed(2)}`, col1X + 45, yPos);

  doc.setFont('helvetica', 'bold');
  doc.text('Tax Collected:', col2X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(`${currencySymbol} ${reportData.taxCollected.toFixed(2)}`, col2X + 35, yPos);

  yPos += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Items Sold:', col1X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(`${reportData.totalItemsSold}`, col1X + 45, yPos);

  doc.setFont('helvetica', 'bold');
  doc.text('Avg Order Value:', col2X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(`${currencySymbol} ${reportData.averageOrderValue.toFixed(2)}`, col2X + 35, yPos);

  yPos += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Gross Margin:', col1X, yPos);
  doc.setFont('helvetica', 'normal');
  const grossMarginPercent = reportData.totalRevenue > 0 ? 
    ((reportData.netSales / reportData.totalRevenue) * 100).toFixed(1) : '0.0';
  doc.text(`${grossMarginPercent}%`, col1X + 45, yPos);

  // Payment Method Breakdown
  yPos = 130;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(199, 169, 86);
  doc.text('Payment Method Breakdown', 14, yPos);

  autoTable(doc, {
    startY: yPos + 5,
    head: [['Payment Method', 'Orders', 'Amount', 'Avg/Order', 'Percentage']],
    body: [
      [
        'Cash',
        reportData.cashOrders.toString(),
        `${currencySymbol} ${reportData.totalCashSales.toFixed(2)}`,
        `${currencySymbol} ${reportData.cashOrders > 0 ? (reportData.totalCashSales / reportData.cashOrders).toFixed(2) : '0.00'}`,
        `${((reportData.totalCashSales / reportData.totalRevenue) * 100).toFixed(1)}%`
      ],
      [
        'Card',
        reportData.cardOrders.toString(),
        `${currencySymbol} ${reportData.totalCardSales.toFixed(2)}`,
        `${currencySymbol} ${reportData.cardOrders > 0 ? (reportData.totalCardSales / reportData.cardOrders).toFixed(2) : '0.00'}`,
        `${((reportData.totalCardSales / reportData.totalRevenue) * 100).toFixed(1)}%`
      ],
      [
        'Online',
        reportData.onlineOrders.toString(),
        `${currencySymbol} ${reportData.totalOnlineSales.toFixed(2)}`,
        `${currencySymbol} ${reportData.onlineOrders > 0 ? (reportData.totalOnlineSales / reportData.onlineOrders).toFixed(2) : '0.00'}`,
        `${((reportData.totalOnlineSales / reportData.totalRevenue) * 100).toFixed(1)}%`
      ],
      [
        'Total',
        reportData.totalOrders.toString(),
        `${currencySymbol} ${reportData.totalRevenue.toFixed(2)}`,
        `${currencySymbol} ${reportData.averageOrderValue.toFixed(2)}`,
        '100.0%'
      ]
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [199, 169, 86],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 9
    },
    footStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 40, halign: 'right' },
      3: { cellWidth: 35, halign: 'right' },
      4: { cellWidth: 30, halign: 'center' }
    }
  });

  // Cash Reconciliation Section
  yPos = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(199, 169, 86);
  doc.text('Cash Reconciliation', 14, yPos);

  autoTable(doc, {
    startY: yPos + 5,
    head: [['Description', 'Amount']],
    body: [
      ['Opening Balance', `${currencySymbol} 0.00`],
      ['Cash Sales', `${currencySymbol} ${reportData.totalCashSales.toFixed(2)}`],
      ['Total Cash Expected', `${currencySymbol} ${reportData.totalCashSales.toFixed(2)}`],
      ['Cash in Drawer (Actual)', `${currencySymbol} __________`],
      ['Difference', `${currencySymbol} __________`]
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [199, 169, 86],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10
    },
    bodyStyles: {
      fontSize: 9
    },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 70, halign: 'right', fontStyle: 'bold' }
    }
  });

  // Top Selling Products
  yPos = (doc as any).lastAutoTable.finalY + 15;
  
  if (yPos + 40 > pageHeight - 20) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(199, 169, 86);
  doc.text('Top Selling Products', 14, yPos);

  const topProductsData = reportData.topProducts.slice(0, 10).map((product, index) => [
    (index + 1).toString(),
    product.name,
    product.quantity.toString(),
    `${currencySymbol} ${product.revenue.toFixed(2)}`,
    `${((product.revenue / reportData.totalRevenue) * 100).toFixed(1)}%`
  ]);

  autoTable(doc, {
    startY: yPos + 5,
    head: [['#', 'Product Name', 'Qty Sold', 'Revenue', '% of Total']],
    body: topProductsData,
    theme: 'striped',
    headStyles: {
      fillColor: [199, 169, 86],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 9
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 70 },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 35, halign: 'right' },
      4: { cellWidth: 28, halign: 'center' }
    }
  });

  // Category Breakdown
  yPos = (doc as any).lastAutoTable.finalY + 15;
  
  if (yPos + 40 > pageHeight - 20) {
    doc.addPage();
    yPos = 20;
  }

  if (reportData.categoryBreakdown && reportData.categoryBreakdown.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(199, 169, 86);
    doc.text('Sales by Category', 14, yPos);

    const categoryData = reportData.categoryBreakdown.map(cat => [
      cat.category,
      cat.itemsSold.toString(),
      `${currencySymbol} ${cat.revenue.toFixed(2)}`,
      `${((cat.revenue / reportData.totalRevenue) * 100).toFixed(1)}%`
    ]);

    autoTable(doc, {
      startY: yPos + 5,
      head: [['Category', 'Items Sold', 'Revenue', '% of Total']],
      body: categoryData,
      theme: 'grid',
      headStyles: {
        fillColor: [199, 169, 86],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      bodyStyles: {
        fontSize: 9
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 40, halign: 'right' },
        3: { cellWidth: 30, halign: 'center' }
      }
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Hourly Sales Breakdown
  if (yPos + 40 > pageHeight - 20) {
    doc.addPage();
    yPos = 20;
  }

  if (reportData.hourlyBreakdown && reportData.hourlyBreakdown.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(199, 169, 86);
    doc.text('Hourly Sales Breakdown', 14, yPos);

    const hourlyData = reportData.hourlyBreakdown.map(hour => [
      hour.hour,
      hour.orders.toString(),
      `${currencySymbol} ${hour.revenue.toFixed(2)}`,
      `${currencySymbol} ${hour.orders > 0 ? (hour.revenue / hour.orders).toFixed(2) : '0.00'}`
    ]);

    autoTable(doc, {
      startY: yPos + 5,
      head: [['Time Period', 'Orders', 'Revenue', 'Avg/Order']],
      body: hourlyData,
      theme: 'striped',
      headStyles: {
        fillColor: [199, 169, 86],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      bodyStyles: {
        fontSize: 9
      },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 45, halign: 'right' },
        3: { cellWidth: 45, halign: 'right' }
      }
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Staff Performance
  if (yPos + 40 > pageHeight - 20) {
    doc.addPage();
    yPos = 20;
  }

  if (reportData.staffPerformance && reportData.staffPerformance.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(199, 169, 86);
    doc.text('Staff Performance', 14, yPos);

    const staffData = reportData.staffPerformance.map(staff => [
      staff.staff,
      staff.orders.toString(),
      `${currencySymbol} ${staff.revenue.toFixed(2)}`,
      `${currencySymbol} ${staff.averageOrderValue.toFixed(2)}`,
      `${((staff.revenue / reportData.totalRevenue) * 100).toFixed(1)}%`
    ]);

    autoTable(doc, {
      startY: yPos + 5,
      head: [['Staff Member', 'Orders', 'Revenue', 'Avg/Order', '% of Total']],
      body: staffData,
      theme: 'grid',
      headStyles: {
        fillColor: [199, 169, 86],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      bodyStyles: {
        fontSize: 9
      },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 35, halign: 'right' },
        4: { cellWidth: 25, halign: 'center' }
      }
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Transaction Details
  if (yPos + 40 > pageHeight - 20) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(199, 169, 86);
  doc.text('Transaction Details', 14, yPos);

  const transactionData = reportData.orders.map(order => [
    order.id.substring(0, 8),
    format(new Date(order.created_at), 'HH:mm'),
    order.payment_mode || 'N/A',
    `${currencySymbol} ${Number(order.total).toFixed(2)}`,
    order.staff_name || 'Unknown'
  ]);

  autoTable(doc, {
    startY: yPos + 5,
    head: [['Order ID', 'Time', 'Payment', 'Amount', 'Staff']],
    body: transactionData,
    theme: 'striped',
    headStyles: {
      fillColor: [199, 169, 86],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 8
    },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 25 },
      2: { cellWidth: 30 },
      3: { cellWidth: 35, halign: 'right' },
      4: { cellWidth: 50 }
    }
  });

  // Signature Section on last page
  yPos = (doc as any).lastAutoTable.finalY + 20;
  
  if (yPos + 50 > pageHeight - 20) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  
  doc.text('Prepared By: ________________', 14, yPos);
  doc.text('Verified By: ________________', pageWidth / 2 + 10, yPos);
  
  doc.text('Signature: ________________', 14, yPos + 10);
  doc.text('Signature: ________________', pageWidth / 2 + 10, yPos + 10);

  doc.text('Date: ________________', 14, yPos + 20);
  doc.text('Date: ________________', pageWidth / 2 + 10, yPos + 20);

  // Add page numbers and footer to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    doc.text('James Cafe - Confidential', pageWidth - 14, pageHeight - 10, { align: 'right' });
  }

  // Save the PDF
  const fileName = `Settlement_Report_${format(reportDate, 'yyyy-MM-dd')}.pdf`;
  doc.save(fileName);
}
