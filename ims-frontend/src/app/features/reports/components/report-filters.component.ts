import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryDto } from '../../../core/services/category.service';
import { SupplierResponseDto } from '../../../core/services/supplier.service';
import { ProductListDto } from '../../../core/services/product.service';
import { ReportType } from '../../../core/models/report.models';

@Component({
  selector: 'app-report-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-sm shadow-zinc-100/50 print:hidden">
      <div class="flex items-center justify-between pb-4 border-b border-zinc-100 mb-4">
        <div class="flex items-center gap-2">
          <svg class="w-4.5 h-4.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span class="text-sm font-bold text-zinc-800">Filter Parameters</span>
        </div>
        <button (click)="onClear()" class="text-xs font-semibold text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer">
          Reset Filters
        </button>
      </div>

      <!-- Inventory Filters -->
      @if (activeTab === 'inventory') {
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wide">Category</label>
            <select
              [ngModel]="invCategoryId"
              (ngModelChange)="onInvCategoryChange($event)"
              class="w-full text-sm bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-500 transition-all"
            >
              <option [value]="null">All Categories</option>
              @for (cat of categories; track cat.categoryId) {
                <option [value]="cat.categoryId">{{ cat.name }}</option>
              }
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wide">Supplier</label>
            <select
              [ngModel]="invSupplierId"
              (ngModelChange)="onInvSupplierChange($event)"
              class="w-full text-sm bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-500 transition-all"
            >
              <option [value]="null">All Suppliers</option>
              @for (sup of suppliers; track sup.supplierId) {
                <option [value]="sup.supplierId">{{ sup.companyName }}</option>
              }
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wide">Stock Status</label>
            <select
              [ngModel]="invStatus"
              (ngModelChange)="onInvStatusChange($event)"
              class="w-full text-sm bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-500 transition-all"
            >
              <option value="All">All Statuses</option>
              <option value="LowStock">Low Stock (≤ Reorder)</option>
              <option value="OutOfStock">Out of Stock</option>
              <option value="Normal">Normal Stock</option>
            </select>
          </div>
        </div>
      }

      <!-- Transaction Filters -->
      @if (activeTab === 'transactions') {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label class="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wide">Product</label>
            <select
              [ngModel]="txProductId"
              (ngModelChange)="onTxProductChange($event)"
              class="w-full text-sm bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-500 transition-all"
            >
              <option [value]="null">All Products</option>
              @for (p of products; track p.productId) {
                <option [value]="p.productId">{{ p.name }} ({{ p.barcode }})</option>
              }
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wide">Movement Type</label>
            <select
              [ngModel]="txType"
              (ngModelChange)="onTxTypeChange($event)"
              class="w-full text-sm bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-500 transition-all"
            >
              <option value="All">All Movements</option>
              <option value="StockIn">Stock In</option>
              <option value="StockOut">Stock Out</option>
              <option value="Adjustment">Adjustment</option>
              <option value="Return">Return</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wide">Date Preset</label>
            <select
              [ngModel]="txPreset"
              (ngModelChange)="onTxPresetChange($event)"
              class="w-full text-sm bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-500 transition-all cursor-pointer font-medium text-zinc-700"
            >
              <option value="all">All Time</option>
              <option value="last-week">Last Week</option>
              <option value="last-month">Last Month</option>
              <option value="last-3-months">Last 3 Months</option>
              <option value="last-1-year">Last 1 Year</option>
              @if (txPreset === 'custom') {
                <option value="custom">Custom Range</option>
              }
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wide">Start Date</label>
            <input
              type="date"
              [ngModel]="txStartDate"
              (ngModelChange)="onTxStartDateChange($event)"
              class="w-full text-sm bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200 rounded-xl px-3.5 py-2 outline-none focus:border-blue-500 transition-all"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wide">End Date</label>
            <input
              type="date"
              [ngModel]="txEndDate"
              (ngModelChange)="onTxEndDateChange($event)"
              class="w-full text-sm bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200 rounded-xl px-3.5 py-2 outline-none focus:border-blue-500 transition-all"
            />
          </div>
        </div>
      }

      <!-- Purchase Requests Filters -->
      @if (activeTab === 'purchase-requests') {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label class="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wide">Supplier</label>
            <select
              [ngModel]="prSupplierId"
              (ngModelChange)="onPrSupplierChange($event)"
              class="w-full text-sm bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-500 transition-all"
            >
              <option [value]="null">All Suppliers</option>
              @for (sup of suppliers; track sup.supplierId) {
                <option [value]="sup.supplierId">{{ sup.companyName }}</option>
              }
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wide">Request Status</label>
            <select
              [ngModel]="prStatus"
              (ngModelChange)="onPrStatusChange($event)"
              class="w-full text-sm bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-500 transition-all"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Accepted">Accepted</option>
              <option value="Delivered">Delivered</option>
              <option value="Rejected">Rejected</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wide">Date Preset</label>
            <select
              [ngModel]="prPreset"
              (ngModelChange)="onPrPresetChange($event)"
              class="w-full text-sm bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-500 transition-all cursor-pointer font-medium text-zinc-700"
            >
              <option value="all">All Time</option>
              <option value="last-week">Last Week</option>
              <option value="last-month">Last Month</option>
              <option value="last-3-months">Last 3 Months</option>
              <option value="last-1-year">Last 1 Year</option>
              @if (prPreset === 'custom') {
                <option value="custom">Custom Range</option>
              }
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wide">Start Date</label>
            <input
              type="date"
              [ngModel]="prStartDate"
              (ngModelChange)="onPrStartDateChange($event)"
              class="w-full text-sm bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200 rounded-xl px-3.5 py-2 outline-none focus:border-blue-500 transition-all"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wide">End Date</label>
            <input
              type="date"
              [ngModel]="prEndDate"
              (ngModelChange)="onPrEndDateChange($event)"
              class="w-full text-sm bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200 rounded-xl px-3.5 py-2 outline-none focus:border-blue-500 transition-all"
            />
          </div>
        </div>
      }
    </div>
  `
})
export class ReportFiltersComponent implements OnChanges {
  @Input() activeTab: ReportType = 'inventory';
  @Input() categories: CategoryDto[] = [];
  @Input() suppliers: SupplierResponseDto[] = [];
  @Input() products: ProductListDto[] = [];

  // Values passed from parent
  @Input() invCategoryId: number | null = null;
  @Input() invSupplierId: number | null = null;
  @Input() invStatus: string = 'All';

  @Input() txProductId: number | null = null;
  @Input() txType: string = 'All';
  @Input() txStartDate: string = '';
  @Input() txEndDate: string = '';

  @Input() prSupplierId: number | null = null;
  @Input() prStatus: string = 'All';
  @Input() prStartDate: string = '';
  @Input() prEndDate: string = '';

  // Local Preset trackers
  txPreset = 'all';
  prPreset = 'all';

  // Emitters
  @Output() invCategoryIdChange = new EventEmitter<number | null>();
  @Output() invSupplierIdChange = new EventEmitter<number | null>();
  @Output() invStatusChange = new EventEmitter<string>();

  @Output() txProductIdChange = new EventEmitter<number | null>();
  @Output() txTypeChange = new EventEmitter<string>();
  @Output() txStartDateChange = new EventEmitter<string>();
  @Output() txEndDateChange = new EventEmitter<string>();

  @Output() prSupplierIdChange = new EventEmitter<number | null>();
  @Output() prStatusChange = new EventEmitter<string>();
  @Output() prStartDateChange = new EventEmitter<string>();
  @Output() prEndDateChange = new EventEmitter<string>();

  @Output() filterChanged = new EventEmitter<void>();
  @Output() filterCleared = new EventEmitter<void>();

  ngOnChanges(changes: SimpleChanges): void {
    this.updatePresets();
  }

  updatePresets(): void {
    this.txPreset = this.getPresetForDates(this.txStartDate, this.txEndDate);
    this.prPreset = this.getPresetForDates(this.prStartDate, this.prEndDate);
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

  onTxPresetChange(preset: string) {
    this.txPreset = preset;
    const { startDate, endDate } = this.calculateDatesForPreset(preset);
    this.txStartDate = startDate;
    this.txEndDate = endDate;
    this.txStartDateChange.emit(startDate);
    this.txEndDateChange.emit(endDate);
    this.filterChanged.emit();
  }

  onPrPresetChange(preset: string) {
    this.prPreset = preset;
    const { startDate, endDate } = this.calculateDatesForPreset(preset);
    this.prStartDate = startDate;
    this.prEndDate = endDate;
    this.prStartDateChange.emit(startDate);
    this.prEndDateChange.emit(endDate);
    this.filterChanged.emit();
  }

  // Helpers
  onInvCategoryChange(val: any) {
    const id = val === 'null' || val === null ? null : Number(val);
    this.invCategoryIdChange.emit(id);
    this.filterChanged.emit();
  }

  onInvSupplierChange(val: any) {
    const id = val === 'null' || val === null ? null : Number(val);
    this.invSupplierIdChange.emit(id);
    this.filterChanged.emit();
  }

  onInvStatusChange(val: string) {
    this.invStatusChange.emit(val);
    this.filterChanged.emit();
  }

  onTxProductChange(val: any) {
    const id = val === 'null' || val === null ? null : Number(val);
    this.txProductIdChange.emit(id);
    this.filterChanged.emit();
  }

  onTxTypeChange(val: string) {
    this.txTypeChange.emit(val);
    this.filterChanged.emit();
  }

  onTxStartDateChange(val: string) {
    this.txStartDate = val;
    this.txStartDateChange.emit(val);
    this.updatePresets();
    this.filterChanged.emit();
  }

  onTxEndDateChange(val: string) {
    this.txEndDate = val;
    this.txEndDateChange.emit(val);
    this.updatePresets();
    this.filterChanged.emit();
  }

  onPrSupplierChange(val: any) {
    const id = val === 'null' || val === null ? null : Number(val);
    this.prSupplierIdChange.emit(id);
    this.filterChanged.emit();
  }

  onPrStatusChange(val: string) {
    this.prStatusChange.emit(val);
    this.filterChanged.emit();
  }

  onPrStartDateChange(val: string) {
    this.prStartDate = val;
    this.prStartDateChange.emit(val);
    this.updatePresets();
    this.filterChanged.emit();
  }

  onPrEndDateChange(val: string) {
    this.prEndDate = val;
    this.prEndDateChange.emit(val);
    this.updatePresets();
    this.filterChanged.emit();
  }

  onClear() {
    this.filterCleared.emit();
  }
}
