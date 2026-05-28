import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../core/services/report.service';
import { CategoryService, CategoryDto } from '../../core/services/category.service';
import { SupplierService, SupplierResponseDto } from '../../core/services/supplier.service';
import { ProductService, ProductListDto } from '../../core/services/product.service';
import { ToastService } from '../../core/services/toast.service';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Modular central models
import {
  ReportType,
  InventoryReportItem,
  TransactionReportItem,
  PurchaseRequestReportItem
} from '../../core/models/report.models';

// Sub-components
import { ReportFiltersComponent } from './components/report-filters.component';
import { ReportKpiCardsComponent } from './components/report-kpi-cards.component';
import { ReportTableComponent } from './components/report-table.component';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReportFiltersComponent,
    ReportKpiCardsComponent,
    ReportTableComponent
  ],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css'
})
export class ReportsComponent implements OnInit {
  private readonly reportService = inject(ReportService);
  private readonly categoryService = inject(CategoryService);
  private readonly supplierService = inject(SupplierService);
  private readonly productService = inject(ProductService);
  private readonly toastService = inject(ToastService);

  // Tab State
  readonly activeTab = signal<ReportType>('inventory');
  readonly isLoading = signal(true);
  readonly isGenerating = signal(false);

  // Dropdown Options
  readonly categories = signal<CategoryDto[]>([]);
  readonly suppliers = signal<SupplierResponseDto[]>([]);
  readonly products = signal<ProductListDto[]>([]);

  // Filter States (Passed as model values to Filter Component)
  readonly invCategoryId = signal<number | null>(null);
  readonly invSupplierId = signal<number | null>(null);
  readonly invStatus = signal<string>('All');

  readonly txProductId = signal<number | null>(null);
  readonly txType = signal<string>('All');
  readonly txStartDate = signal<string>('');
  readonly txEndDate = signal<string>('');

  readonly prSupplierId = signal<number | null>(null);
  readonly prStatus = signal<string>('All');
  readonly prStartDate = signal<string>('');
  readonly prEndDate = signal<string>('');

  // Report Data
  readonly inventoryData = signal<InventoryReportItem[]>([]);
  readonly transactionData = signal<TransactionReportItem[]>([]);
  readonly purchaseRequestData = signal<PurchaseRequestReportItem[]>([]);

  readonly today = new Date();

  // Computed Summaries - Inventory
  readonly inventoryValuationSum = computed(() => {
    return this.inventoryData().reduce((acc, item) => acc + item.totalValue, 0);
  });
  
  readonly inventoryCostValuationSum = computed(() => {
    return this.inventoryData().reduce((acc, item) => acc + item.totalCostValue, 0);
  });

  readonly inventorySkuCount = computed(() => {
    return this.inventoryData().length;
  });

  readonly inventoryTotalQuantity = computed(() => {
    return this.inventoryData().reduce((acc, item) => acc + item.quantity, 0);
  });

  readonly inventoryLowStockCount = computed(() => {
    return this.inventoryData().filter(item => item.isLowStock).length;
  });

  // Computed Summaries - Transactions
  readonly txTotalCount = computed(() => {
    return this.transactionData().length;
  });

  readonly txInCount = computed(() => {
    return this.transactionData().filter(t => t.type === 'StockIn').length;
  });

  readonly txOutCount = computed(() => {
    return this.transactionData().filter(t => t.type === 'StockOut').length;
  });

  readonly txAdjustmentCount = computed(() => {
    return this.transactionData().filter(t => t.type === 'Adjustment').length;
  });

  readonly txReturnCount = computed(() => {
    return this.transactionData().filter(t => t.type === 'Return').length;
  });

  readonly txTotalQtyMoved = computed(() => {
    return this.transactionData().reduce((acc, t) => acc + Math.abs(t.quantity), 0);
  });

  // Computed Summaries - Purchase Requests
  readonly prTotalCount = computed(() => {
    return this.purchaseRequestData().length;
  });

  readonly prPendingCount = computed(() => {
    return this.purchaseRequestData().filter(r => r.status === 'Pending').length;
  });

  readonly prAcceptedCount = computed(() => {
    return this.purchaseRequestData().filter(r => r.status === 'Accepted').length;
  });

  readonly prDeliveredCount = computed(() => {
    return this.purchaseRequestData().filter(r => r.status === 'Delivered').length;
  });

  readonly prTotalCostSum = computed(() => {
    return this.purchaseRequestData().reduce((acc, r) => acc + r.totalCost, 0);
  });

  // Unified presentational stats structures passed down to KPI sub-component
  readonly inventoryStats = computed(() => ({
    skuCount: this.inventorySkuCount(),
    totalQty: this.inventoryTotalQuantity(),
    lowStockCount: this.inventoryLowStockCount(),
    valuation: this.inventoryCostValuationSum()
  }));

  readonly transactionStats = computed(() => ({
    totalCount: this.txTotalCount(),
    qtyMoved: this.txTotalQtyMoved(),
    inCount: this.txInCount(),
    outCount: this.txOutCount(),
    adjCount: this.txAdjustmentCount(),
    retCount: this.txReturnCount()
  }));

  readonly purchaseRequestStats = computed(() => ({
    totalCount: this.prTotalCount(),
    pendingCount: this.prPendingCount(),
    deliveredCount: this.prDeliveredCount(),
    spendValue: this.prTotalCostSum()
  }));

  ngOnInit(): void {
    this.loadDropdownOptions();
    this.generateReport();
  }

  loadDropdownOptions(): void {
    this.categoryService.getAll().subscribe({
      next: (res) => this.categories.set(res),
      error: () => this.toastService.error('Failed to load categories.')
    });

    this.supplierService.getAll().subscribe({
      next: (res) => this.suppliers.set(res),
      error: () => this.toastService.error('Failed to load suppliers.')
    });

    this.productService.getAll().subscribe({
      next: (res) => this.products.set(res),
      error: () => this.toastService.error('Failed to load products.')
    });

    this.isLoading.set(false);
  }

  switchTab(tab: ReportType): void {
    this.activeTab.set(tab);
    this.generateReport();
  }

  generateReport(): void {
    this.isGenerating.set(true);
    const tab = this.activeTab();

    if (tab === 'inventory') {
      this.reportService.getInventoryReport({
        categoryId: this.invCategoryId(),
        supplierId: this.invSupplierId(),
        status: this.invStatus()
      }).subscribe({
        next: (data) => {
          this.inventoryData.set(data);
          this.isGenerating.set(false);
        },
        error: () => {
          this.toastService.error('Failed to load inventory report data.');
          this.isGenerating.set(false);
        }
      });
    } else if (tab === 'transactions') {
      this.reportService.getTransactionReport({
        productId: this.txProductId(),
        type: this.txType(),
        startDate: this.txStartDate() ? new Date(this.txStartDate()).toISOString() : null,
        endDate: this.txEndDate() ? new Date(this.txEndDate()).toISOString() : null
      }).subscribe({
        next: (data) => {
          this.transactionData.set(data);
          this.isGenerating.set(false);
        },
        error: () => {
          this.toastService.error('Failed to load transaction report data.');
          this.isGenerating.set(false);
        }
      });
    } else if (tab === 'purchase-requests') {
      this.reportService.getPurchaseRequestReport({
        supplierId: this.prSupplierId(),
        status: this.prStatus(),
        startDate: this.prStartDate() ? new Date(this.prStartDate()).toISOString() : null,
        endDate: this.prEndDate() ? new Date(this.prEndDate()).toISOString() : null
      }).subscribe({
        next: (data) => {
          this.purchaseRequestData.set(data);
          this.isGenerating.set(false);
        },
        error: () => {
          this.toastService.error('Failed to load purchase requests report data.');
          this.isGenerating.set(false);
        }
      });
    }
  }

  exportCsv(): void {
    const tab = this.activeTab();
    let exportObs$;

    if (tab === 'inventory') {
      exportObs$ = this.reportService.exportInventoryReport({
        categoryId: this.invCategoryId(),
        supplierId: this.invSupplierId(),
        status: this.invStatus()
      });
    } else if (tab === 'transactions') {
      exportObs$ = this.reportService.exportTransactionReport({
        productId: this.txProductId(),
        type: this.txType(),
        startDate: this.txStartDate() ? new Date(this.txStartDate()).toISOString() : null,
        endDate: this.txEndDate() ? new Date(this.txEndDate()).toISOString() : null
      });
    } else {
      exportObs$ = this.reportService.exportPurchaseRequestReport({
        supplierId: this.prSupplierId(),
        status: this.prStatus(),
        startDate: this.prStartDate() ? new Date(this.prStartDate()).toISOString() : null,
        endDate: this.prEndDate() ? new Date(this.prEndDate()).toISOString() : null
      });
    }

    this.toastService.success('Preparing CSV file for download...');
    exportObs$.subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        const timestamp = new Date().toISOString().slice(0,19).replace(/[-T:]/g,"_");
        a.download = `${tab}_report_${timestamp}.csv`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.toastService.success('CSV Downloaded successfully!');
      },
      error: () => {
        this.toastService.error('Failed to export CSV report.');
      }
    });
  }

  downloadPdf(): void {
    const tab = this.activeTab();
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // 1. Title & Header Info
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(24, 24, 27); // zinc-900
    
    let reportTitle = '';
    if (tab === 'inventory') reportTitle = 'INVENTORY STATUS & VALUATION REPORT';
    else if (tab === 'transactions') reportTitle = 'STOCK MOVEMENTS & TRANSACTIONS REPORT';
    else reportTitle = 'PURCHASE REQUESTS & PROCUREMENT REPORT';

    doc.text(reportTitle, 14, 20);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(113, 113, 122); // zinc-500
    
    const formattedDate = new Date().toLocaleString();
    doc.text(`Generated on: ${formattedDate} | System: IMS Portal`, 14, 26);

    // 2. Add Filter Parameters info
    let filterText = 'Filters applied: ';
    if (tab === 'inventory') {
      const category = this.categories().find(c => c.categoryId === Number(this.invCategoryId()))?.name || 'All';
      const supplier = this.suppliers().find(s => s.supplierId === Number(this.invSupplierId()))?.companyName || 'All';
      filterText += `Category: ${category} | Supplier: ${supplier} | Stock Status: ${this.invStatus()}`;
    } else if (tab === 'transactions') {
      const product = this.products().find(p => p.productId === Number(this.txProductId()))?.name || 'All';
      const start = this.txStartDate() || 'N/A';
      const end = this.txEndDate() || 'N/A';
      filterText += `Product: ${product} | Type: ${this.txType()} | Date Range: ${start} to ${end}`;
    } else {
      const supplier = this.suppliers().find(s => s.supplierId === Number(this.prSupplierId()))?.companyName || 'All';
      const start = this.prStartDate() || 'N/A';
      const end = this.prEndDate() || 'N/A';
      filterText += `Supplier: ${supplier} | Status: ${this.prStatus()} | Date Range: ${start} to ${end}`;
    }
    doc.text(filterText, 14, 32);

    // 3. Add KPI Summary Cards
    doc.setFillColor(244, 244, 245); // zinc-100
    doc.rect(14, 37, 269, 18, 'F');
    
    doc.setFontSize(9);
    doc.setTextColor(82, 82, 91); // zinc-600
    doc.setFont('Helvetica', 'bold');

    if (tab === 'inventory') {
      doc.text(`Total SKU Count: ${this.inventorySkuCount()}`, 20, 48);
      doc.text(`Total Qty on Hand: ${this.inventoryTotalQuantity().toLocaleString()}`, 80, 48);
      doc.text(`Low Stock Items: ${this.inventoryLowStockCount()}`, 145, 48);
      doc.text(`Total Cost Valuation: LKR ${this.inventoryCostValuationSum().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 205, 48);
    } else if (tab === 'transactions') {
      doc.text(`Total Transactions: ${this.txTotalCount()}`, 20, 48);
      doc.text(`Total Qty Moved: ${this.txTotalQtyMoved().toLocaleString()}`, 80, 48);
      doc.text(`In / Out: +${this.txInCount()} / -${this.txOutCount()}`, 145, 48);
      doc.text(`Adj / Ret: ${this.txAdjustmentCount()} adj / ${this.txReturnCount()} ret`, 210, 48);
    } else {
      doc.text(`Total Requests: ${this.prTotalCount()}`, 20, 48);
      doc.text(`Pending Approval: ${this.prPendingCount()}`, 80, 48);
      doc.text(`Completed Orders: ${this.prDeliveredCount()}`, 145, 48);
      doc.text(`Total Spend Value: LKR ${this.prTotalCostSum().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 205, 48);
    }

    // 4. Generate Table
    let tableHead: string[][] = [];
    let tableBody: any[][] = [];

    if (tab === 'inventory') {
      tableHead = [['Barcode', 'Product Name', 'Category', 'Supplier', 'Price (LKR)', 'Cost Price (LKR)', 'Stock', 'Valuation (LKR)', 'Status']];
      tableBody = this.inventoryData().map(item => [
        item.barcode,
        item.productName,
        item.categoryName,
        item.supplierName,
        item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        item.costPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        item.quantity.toString(),
        item.totalCostValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        item.quantity === 0 ? 'Out of Stock' : item.isLowStock ? 'Low Stock' : 'In Stock'
      ]);
    } else if (tab === 'transactions') {
      tableHead = [['Date/Time', 'Tx ID', 'Barcode', 'Product Name', 'Type', 'Quantity', 'Performed By', 'Notes']];
      tableBody = this.transactionData().map(tx => [
        new Date(tx.createdAt).toLocaleString(),
        `#${tx.transactionId}`,
        tx.productBarcode,
        tx.productName,
        tx.type,
        tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity.toString(),
        tx.userEmail,
        tx.notes || ''
      ]);
    } else {
      tableHead = [['Requested Date', 'Order #', 'Supplier', 'Status', 'Items', 'Total Cost (LKR)', 'Exp. Delivery', 'Delivered Date', 'Notes']];
      tableBody = this.purchaseRequestData().map(req => [
        new Date(req.requestedDate).toLocaleString(),
        req.requestNumber,
        req.supplierCompanyName,
        req.status,
        req.itemCount.toString(),
        req.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        req.expectedDeliveryDate ? new Date(req.expectedDeliveryDate).toLocaleDateString() : '—',
        req.deliveredDate ? new Date(req.deliveredDate).toLocaleString() : '—',
        req.notes || ''
      ]);
    }

    // Call autoTable on the document
    autoTable(doc, {
      head: tableHead,
      body: tableBody,
      startY: 60,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2,
        valign: 'middle'
      },
      headStyles: {
        fillColor: [37, 99, 235], // Blue-600
        textColor: 255,
        fontStyle: 'bold'
      },
      columnStyles: tab === 'inventory' ? {
        4: { halign: 'right' }, // Price
        5: { halign: 'right' }, // Cost
        6: { halign: 'center' }, // Stock
        7: { halign: 'right' }, // Valuation
        8: { halign: 'center' }  // Status
      } : tab === 'transactions' ? {
        1: { halign: 'center' }, // ID
        4: { halign: 'center' }, // Type
        5: { halign: 'center' }  // Qty
      } : {
        3: { halign: 'center' }, // Status
        4: { halign: 'center' }, // Items
        5: { halign: 'right' }  // Cost
      },
      didDrawPage: (data: any) => {
        // Footer (Page Numbering)
        const str = `Page ${doc.getNumberOfPages()}`;
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(113, 113, 122);
        doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 10);
      }
    });

    const timestamp = new Date().toISOString().slice(0, 19).replace(/[-T:]/g, "_");
    doc.save(`${tab}_report_${timestamp}.pdf`);
    this.toastService.success('PDF document downloaded successfully!');
  }

  clearFilters(): void {
    const tab = this.activeTab();
    if (tab === 'inventory') {
      this.invCategoryId.set(null);
      this.invSupplierId.set(null);
      this.invStatus.set('All');
    } else if (tab === 'transactions') {
      this.txProductId.set(null);
      this.txType.set('All');
      this.txStartDate.set('');
      this.txEndDate.set('');
    } else if (tab === 'purchase-requests') {
      this.prSupplierId.set(null);
      this.prStatus.set('All');
      this.prStartDate.set('');
      this.prEndDate.set('');
    }
    this.generateReport();
  }
}
