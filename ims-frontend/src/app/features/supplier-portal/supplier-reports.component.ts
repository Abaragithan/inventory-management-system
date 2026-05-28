import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../core/services/report.service';
import { CategoryService, CategoryDto } from '../../core/services/category.service';
import { ToastService } from '../../core/services/toast.service';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Reusing models
import {
  InventoryReportItem,
  PurchaseRequestReportItem
} from '../../core/models/report.models';

@Component({
  selector: 'app-supplier-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './supplier-reports.component.html'
})
export class SupplierReportsComponent implements OnInit {
  private readonly reportService = inject(ReportService);
  private readonly categoryService = inject(CategoryService);
  private readonly toastService = inject(ToastService);

  readonly activeTab = signal<'inventory' | 'purchase-requests'>('inventory');
  readonly isLoading = signal(true);
  readonly isGenerating = signal(false);

  // Dropdown list options
  readonly categories = signal<CategoryDto[]>([]);

  // Filter states
  readonly invCategoryId = signal<number | null>(null);
  readonly invStatus = signal<string>('All');

  readonly prStatus = signal<string>('All');
  readonly prStartDate = signal<string>('');
  readonly prEndDate = signal<string>('');

  // Pagination states
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly prPreset = signal('all');

  // Report Data
  readonly inventoryData = signal<InventoryReportItem[]>([]);
  readonly purchaseRequestData = signal<PurchaseRequestReportItem[]>([]);

  // Computed paged lists
  readonly pagedInventoryData = computed(() => {
    const data = this.inventoryData();
    const start = (this.page() - 1) * this.pageSize();
    return data.slice(start, start + this.pageSize());
  });

  readonly pagedPurchaseRequestData = computed(() => {
    const data = this.purchaseRequestData();
    const start = (this.page() - 1) * this.pageSize();
    return data.slice(start, start + this.pageSize());
  });

  readonly totalPages = computed(() => {
    const total = this.activeTab() === 'inventory' ? this.inventoryData().length : this.purchaseRequestData().length;
    return Math.ceil(total / this.pageSize());
  });

  protected readonly Math = Math;

  // Computed Summaries - Inventory
  readonly inventoryValuationSum = computed(() => {
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

  // Computed Summaries - Purchase Requests
  readonly prTotalCount = computed(() => {
    return this.purchaseRequestData().length;
  });

  readonly prPendingCount = computed(() => {
    return this.purchaseRequestData().filter(r => r.status === 'Pending').length;
  });

  readonly prDeliveredCount = computed(() => {
    return this.purchaseRequestData().filter(r => r.status === 'Delivered').length;
  });

  readonly prTotalCostSum = computed(() => {
    return this.purchaseRequestData().reduce((acc, r) => acc + r.totalCost, 0);
  });

  ngOnInit(): void {
    this.loadDropdownOptions();
    this.generateReport();
  }

  loadDropdownOptions(): void {
    this.categoryService.getAll().subscribe({
      next: (res) => {
        this.categories.set(res);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error('Failed to load categories.');
        this.isLoading.set(false);
      }
    });
  }

  switchTab(tab: 'inventory' | 'purchase-requests'): void {
    this.activeTab.set(tab);
    this.page.set(1);
    this.generateReport();
  }

  onPrPresetChange(preset: string): void {
    this.prPreset.set(preset);
    const { startDate, endDate } = this.calculateDatesForPreset(preset);
    this.prStartDate.set(startDate);
    this.prEndDate.set(endDate);
    this.page.set(1);
    this.generateReport();
  }

  onDateInputChange(type: 'start' | 'end', val: string): void {
    if (type === 'start') {
      this.prStartDate.set(val);
    } else {
      this.prEndDate.set(val);
    }
    this.prPreset.set(this.getPresetForDates(this.prStartDate(), this.prEndDate()));
    this.page.set(1);
    this.generateReport();
  }

  getPresetForDates(start: string, end: string): string {
    if (!start && !end) return 'all';

    const now = new Date();
    const formatDate = (d: Date) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    const todayStr = formatDate(now);
    if (end !== todayStr) return 'custom';

    const checkPreset = (days: number) => {
      const d = new Date();
      d.setDate(now.getDate() - days);
      return formatDate(d) === start;
    };

    if (checkPreset(7)) return 'last-week';
    if (checkPreset(30)) return 'last-month';
    if (checkPreset(90)) return 'last-3-months';
    if (checkPreset(365)) return 'last-1-year';

    return 'custom';
  }

  calculateDatesForPreset(preset: string): { startDate: string, endDate: string } {
    const now = new Date();
    const formatDate = (date: Date) => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    let start = '';
    let end = '';

    if (preset !== 'all') {
      end = formatDate(now);
      const startDate = new Date();
      if (preset === 'last-week') {
        startDate.setDate(now.getDate() - 7);
      } else if (preset === 'last-month') {
        startDate.setDate(now.getDate() - 30);
      } else if (preset === 'last-3-months') {
        startDate.setDate(now.getDate() - 90);
      } else if (preset === 'last-1-year') {
        startDate.setDate(now.getDate() - 365);
      }
      start = formatDate(startDate);
    }

    return { startDate: start, endDate: end };
  }

  onPageChange(newPage: number): void {
    this.page.set(newPage);
  }

  generateReport(): void {
    this.isGenerating.set(true);
    const tab = this.activeTab();

    if (tab === 'inventory') {
      this.reportService.getInventoryReport({
        categoryId: this.invCategoryId(),
        supplierId: null, // Backend automatically forces current supplier ID
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
    } else if (tab === 'purchase-requests') {
      this.reportService.getPurchaseRequestReport({
        supplierId: null, // Backend automatically forces current supplier ID
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
        supplierId: null,
        status: this.invStatus()
      });
    } else {
      exportObs$ = this.reportService.exportPurchaseRequestReport({
        supplierId: null,
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

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(24, 24, 27); // zinc-900
    
    let reportTitle = '';
    if (tab === 'inventory') reportTitle = 'SUPPLIED INVENTORY STATUS REPORT';
    else reportTitle = 'SUPPLIED PURCHASE ORDERS REPORT';

    doc.text(reportTitle, 14, 20);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(113, 113, 122); // zinc-500
    
    const formattedDate = new Date().toLocaleString();
    doc.text(`Generated on: ${formattedDate} | System: Supplier Portal`, 14, 26);

    let filterText = 'Filters applied: ';
    if (tab === 'inventory') {
      const category = this.categories().find(c => c.categoryId === Number(this.invCategoryId()))?.name || 'All';
      filterText += `Category: ${category} | Stock Status: ${this.invStatus()}`;
    } else {
      const start = this.prStartDate() || 'N/A';
      const end = this.prEndDate() || 'N/A';
      filterText += `Status: ${this.prStatus()} | Date Range: ${start} to ${end}`;
    }
    doc.text(filterText, 14, 32);

    // Summary Cards block
    doc.setFillColor(244, 244, 245); // zinc-100
    doc.rect(14, 37, 269, 18, 'F');
    
    doc.setFontSize(9);
    doc.setTextColor(82, 82, 91); // zinc-600
    doc.setFont('Helvetica', 'bold');

    if (tab === 'inventory') {
      doc.text(`Total SKU Count: ${this.inventorySkuCount()}`, 20, 48);
      doc.text(`Total Qty on Hand: ${this.inventoryTotalQuantity().toLocaleString()}`, 80, 48);
      doc.text(`Low Stock Items: ${this.inventoryLowStockCount()}`, 145, 48);
      doc.text(`Total Cost Valuation: LKR ${this.inventoryValuationSum().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 205, 48);
    } else {
      doc.text(`Total Requests: ${this.prTotalCount()}`, 20, 48);
      doc.text(`Pending Action: ${this.prPendingCount()}`, 80, 48);
      doc.text(`Completed Orders: ${this.prDeliveredCount()}`, 145, 48);
      doc.text(`Total Order Value: LKR ${this.prTotalCostSum().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 205, 48);
    }

    let tableHead: string[][] = [];
    let tableBody: any[][] = [];

    if (tab === 'inventory') {
      tableHead = [['Barcode', 'Product Name', 'Category', 'Price (LKR)', 'Cost Price (LKR)', 'Stock', 'Valuation (LKR)', 'Status']];
      tableBody = this.inventoryData().map(item => [
        item.barcode,
        item.productName,
        item.categoryName,
        item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        item.costPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        item.quantity.toString(),
        item.totalCostValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        item.quantity === 0 ? 'Out of Stock' : item.isLowStock ? 'Low Stock' : 'In Stock'
      ]);
    } else {
      tableHead = [['Requested Date', 'Order #', 'Status', 'ItemsCount', 'Total Cost (LKR)', 'Exp. Delivery', 'Delivered Date', 'Notes']];
      tableBody = this.purchaseRequestData().map(req => [
        new Date(req.requestedDate).toLocaleString(),
        req.requestNumber,
        req.status,
        req.itemCount.toString(),
        req.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        req.expectedDeliveryDate ? new Date(req.expectedDeliveryDate).toLocaleDateString() : '—',
        req.deliveredDate ? new Date(req.deliveredDate).toLocaleString() : '—',
        req.notes || ''
      ]);
    }

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
        fillColor: [5, 150, 105], // Emerald-600
        textColor: 255,
        fontStyle: 'bold'
      },
      columnStyles: tab === 'inventory' ? {
        3: { halign: 'right' }, // Price
        4: { halign: 'right' }, // Cost
        5: { halign: 'center' }, // Stock
        6: { halign: 'right' }, // Valuation
        7: { halign: 'center' }  // Status
      } : {
        2: { halign: 'center' }, // Status
        3: { halign: 'center' }, // Items
        4: { halign: 'right' }  // Cost
      },
      didDrawPage: (data: any) => {
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
    this.page.set(1);
    if (tab === 'inventory') {
      this.invCategoryId.set(null);
      this.invStatus.set('All');
    } else {
      this.prStatus.set('All');
      this.prStartDate.set('');
      this.prEndDate.set('');
      this.prPreset.set('all');
    }
    this.generateReport();
  }
}
