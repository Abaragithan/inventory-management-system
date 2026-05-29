import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import {
  ReportType,
  InventoryReportItem,
  TransactionReportItem,
  PurchaseRequestReportItem
} from '../../../core/models/report.models';

@Component({
  selector: 'app-report-table',
  standalone: true,
  imports: [CommonModule, SkeletonComponent],
  templateUrl: './report-table.component.html'
})
export class ReportTableComponent implements OnChanges {
  @Input() activeTab: ReportType = 'inventory';
  @Input() inventoryData: InventoryReportItem[] = [];
  @Input() transactionData: TransactionReportItem[] = [];
  @Input() purchaseRequestData: PurchaseRequestReportItem[] = [];
  @Input() isGenerating: boolean = false;

  page = 1;
  pageSize = 10;
  protected readonly Math = Math;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['activeTab'] || changes['inventoryData'] || changes['transactionData'] || changes['purchaseRequestData']) {
      this.page = 1;
    }
  }

  get rowCount(): number {
    if (this.activeTab === 'inventory') return this.inventoryData.length;
    if (this.activeTab === 'transactions') return this.transactionData.length;
    return this.purchaseRequestData.length;
  }

  get pagedInventoryData(): InventoryReportItem[] {
    const start = (this.page - 1) * this.pageSize;
    return this.inventoryData.slice(start, start + this.pageSize);
  }

  get pagedTransactionData(): TransactionReportItem[] {
    const start = (this.page - 1) * this.pageSize;
    return this.transactionData.slice(start, start + this.pageSize);
  }

  get pagedPurchaseRequestData(): PurchaseRequestReportItem[] {
    const start = (this.page - 1) * this.pageSize;
    return this.purchaseRequestData.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.rowCount / this.pageSize);
  }

  onPageChange(newPage: number): void {
    this.page = newPage;
  }

  // Styling and Text Helpers for Transactions
  getTransactionBadgeClass(type: string): string {
    switch (type) {
      case 'StockIn':
        return 'bg-emerald-50 border border-emerald-200 text-emerald-700';
      case 'StockOut':
        return 'bg-rose-50 border border-rose-200 text-rose-700';
      case 'Adjustment':
        return 'bg-amber-50 border border-amber-200 text-amber-700';
      case 'Return':
        return 'bg-blue-50 border border-blue-200 text-blue-700';
      default:
        return 'bg-zinc-50 border border-zinc-200 text-zinc-500';
    }
  }

  getTransactionQtyColor(tx: TransactionReportItem): string {
    if (tx.type === 'StockIn' || tx.type === 'Return') return 'text-emerald-600';
    if (tx.type === 'StockOut') return 'text-rose-600';
    return tx.quantity >= 0 ? 'text-emerald-600' : 'text-rose-600';
  }

  getTransactionSign(tx: TransactionReportItem): string {
    if (tx.type === 'StockIn' || tx.type === 'Return') return '+';
    if (tx.type === 'StockOut') return '-';
    return tx.quantity >= 0 ? '+' : '-';
  }

  getTransactionQuantity(tx: TransactionReportItem): number {
    return Math.abs(tx.quantity);
  }

  // Styling Helpers for Purchase Requests
  getPurchaseStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Pending':
        return 'bg-amber-50 border border-amber-200 text-amber-800';
      case 'Accepted':
        return 'bg-blue-50 border border-blue-200 text-blue-700';
      case 'Delivered':
        return 'bg-emerald-50 border border-emerald-200 text-emerald-700';
      case 'Rejected':
        return 'bg-rose-50 border border-rose-200 text-rose-700';
      case 'Cancelled':
        return 'bg-zinc-100 border border-zinc-200 text-zinc-505';
      default:
        return 'bg-zinc-50 border border-zinc-200 text-zinc-505';
    }
  }
}
