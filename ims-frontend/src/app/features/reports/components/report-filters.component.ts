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
  templateUrl: './report-filters.component.html'
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
