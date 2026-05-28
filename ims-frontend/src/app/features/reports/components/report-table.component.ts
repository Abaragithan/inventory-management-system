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
  template: `
    <div class="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden shadow-sm shadow-zinc-100/50 print:border-zinc-300">
      <div class="px-5 py-4 border-b border-zinc-100 flex items-center justify-between print:hidden">
        <span class="text-sm font-bold text-zinc-800">Report Preview Grid</span>
        <span class="text-xs text-zinc-400 font-medium">
          Showing {{ rowCount }} matching entries
        </span>
      </div>

      @if (isGenerating) {
        <div class="p-8">
          <app-skeleton type="table" [rows]="6" />
        </div>
      } @else {
        <!-- Inventory Table -->
        @if (activeTab === 'inventory') {
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm border-collapse">
              <thead>
                <tr class="bg-zinc-50/50 border-b border-zinc-100 text-zinc-400 font-semibold text-xs tracking-wider uppercase">
                  <th class="py-3 px-5">Barcode</th>
                  <th class="py-3 px-5">Product Name</th>
                  <th class="py-3 px-5">Category</th>
                  <th class="py-3 px-5">Supplier</th>
                  <th class="py-3 px-5 text-right">Price</th>
                  <th class="py-3 px-5 text-right">Cost Price</th>
                  <th class="py-3 px-5 text-center">Stock</th>
                  <th class="py-3 px-5 text-right">Valuation (Cost)</th>
                  <th class="py-3 px-5 text-center">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-100">
                @for (item of pagedInventoryData; track item.productId) {
                  <tr class="hover:bg-zinc-50/30 transition-colors">
                    <td class="py-3.5 px-5 font-mono text-zinc-600 text-xs">{{ item.barcode }}</td>
                    <td class="py-3.5 px-5 font-semibold text-zinc-900">{{ item.productName }}</td>
                    <td class="py-3.5 px-5 text-zinc-600">{{ item.categoryName }}</td>
                    <td class="py-3.5 px-5 text-zinc-500 text-xs">{{ item.supplierName }}</td>
                    <td class="py-3.5 px-5 text-right font-medium text-zinc-900">LKR {{ item.price | number:'1.2-2' }}</td>
                    <td class="py-3.5 px-5 text-right text-zinc-500">LKR {{ item.costPrice | number:'1.2-2' }}</td>
                    <td class="py-3.5 px-5 text-center font-semibold text-zinc-900">{{ item.quantity }}</td>
                    <td class="py-3.5 px-5 text-right font-medium text-blue-600">LKR {{ item.totalCostValue | number:'1.2-2' }}</td>
                    <td class="py-3.5 px-5 text-center">
                      @if (item.quantity === 0) {
                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 border border-rose-100 text-rose-700">Out of Stock</span>
                      } @else if (item.isLowStock) {
                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 border border-amber-100 text-amber-700">Low Stock</span>
                      } @else {
                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 border border-emerald-100 text-emerald-700">In Stock</span>
                      }
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="9" class="py-8 text-center text-zinc-400">No products found matching filters.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

        <!-- Transactions Table -->
        @if (activeTab === 'transactions') {
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm border-collapse">
              <thead>
                <tr class="bg-zinc-50/50 border-b border-zinc-100 text-zinc-400 font-semibold text-xs tracking-wider uppercase">
                  <th class="py-3 px-5">Date/Time</th>
                  <th class="py-3 px-5">Transaction ID</th>
                  <th class="py-3 px-5">Barcode</th>
                  <th class="py-3 px-5">Product</th>
                  <th class="py-3 px-5 text-center">Type</th>
                  <th class="py-3 px-5 text-center">Quantity</th>
                  <th class="py-3 px-5">Performed By</th>
                  <th class="py-3 px-5">Notes</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-100">
                @for (tx of pagedTransactionData; track tx.transactionId) {
                  <tr class="hover:bg-zinc-50/30 transition-colors">
                    <td class="py-3.5 px-5 text-zinc-500 text-xs">{{ tx.createdAt | date:'yyyy-MM-dd HH:mm' }}</td>
                    <td class="py-3.5 px-5 text-zinc-400 font-mono text-xs">#{{ tx.transactionId }}</td>
                    <td class="py-3.5 px-5 font-mono text-zinc-650 text-xs">{{ tx.productBarcode }}</td>
                    <td class="py-3.5 px-5 font-semibold text-zinc-900">{{ tx.productName }}</td>
                    <td class="py-3.5 px-5 text-center">
                      <span [ngClass]="getTransactionBadgeClass(tx.type)" class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold">
                        {{ tx.type }}
                      </span>
                    </td>
                    <td class="py-3.5 px-5 text-center font-bold" [ngClass]="getTransactionQtyColor(tx)">
                      {{ getTransactionSign(tx) }}{{ getTransactionQuantity(tx) }}
                    </td>
                    <td class="py-3.5 px-5 text-zinc-600 text-xs">{{ tx.userEmail }}</td>
                    <td class="py-3.5 px-5 text-zinc-500 text-xs max-w-xs truncate" [title]="tx.notes || ''">{{ tx.notes || '—' }}</td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="8" class="py-8 text-center text-zinc-400">No stock transactions found matching filters.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

        <!-- Purchase Requests Table -->
        @if (activeTab === 'purchase-requests') {
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm border-collapse">
              <thead>
                <tr class="bg-zinc-50/50 border-b border-zinc-100 text-zinc-400 font-semibold text-xs tracking-wider uppercase">
                  <th class="py-3 px-5">Requested Date</th>
                  <th class="py-3 px-5">Order #</th>
                  <th class="py-3 px-5">Supplier</th>
                  <th class="py-3 px-5 text-center">Status</th>
                  <th class="py-3 px-5 text-center">Items Count</th>
                  <th class="py-3 px-5 text-right">Total spend</th>
                  <th class="py-3 px-5">Exp. Delivery</th>
                  <th class="py-3 px-5">Delivered</th>
                  <th class="py-3 px-5">Notes</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-100">
                @for (req of pagedPurchaseRequestData; track req.requestId) {
                  <tr class="hover:bg-zinc-50/30 transition-colors">
                    <td class="py-3.5 px-5 text-zinc-500 text-xs">{{ req.requestedDate | date:'yyyy-MM-dd HH:mm' }}</td>
                    <td class="py-3.5 px-5 font-mono text-zinc-900 font-semibold text-xs">{{ req.requestNumber }}</td>
                    <td class="py-3.5 px-5 text-zinc-800 font-medium">{{ req.supplierCompanyName }}</td>
                    <td class="py-3.5 px-5 text-center">
                      <span [ngClass]="getPurchaseStatusBadgeClass(req.status)" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold">
                        {{ req.status }}
                      </span>
                    </td>
                    <td class="py-3.5 px-5 text-center text-zinc-900 font-medium">{{ req.itemCount }}</td>
                    <td class="py-3.5 px-5 text-right font-semibold text-blue-600">LKR {{ req.totalCost | number:'1.2-2' }}</td>
                    <td class="py-3.5 px-5 text-zinc-500 text-xs">{{ (req.expectedDeliveryDate | date:'yyyy-MM-dd') || '—' }}</td>
                    <td class="py-3.5 px-5 text-zinc-500 text-xs">{{ (req.deliveredDate | date:'yyyy-MM-dd HH:mm') || '—' }}</td>
                    <td class="py-3.5 px-5 text-zinc-400 text-xs max-w-xs truncate" [title]="req.notes">{{ req.notes || '—' }}</td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="9" class="py-8 text-center text-zinc-400">No purchase requests found matching filters.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

        <!-- Pagination Controls -->
        @if (rowCount > 0) {
          <div class="px-6 py-4 bg-zinc-50 border-t border-zinc-150 flex items-center justify-between flex-wrap gap-4 print:hidden">
            <span class="text-xs text-zinc-500 font-medium">
              Showing {{ (page - 1) * pageSize + 1 }} to {{ Math.min(page * pageSize, rowCount) }} of {{ rowCount }} entries
            </span>
            <div class="flex items-center gap-1.5">
              <button
                [disabled]="page === 1"
                (click)="onPageChange(page - 1)"
                class="p-2 border border-zinc-200 bg-white hover:bg-zinc-50 rounded-lg text-zinc-650 transition-all disabled:opacity-40 cursor-pointer"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              @for (p of [].constructor(totalPages); track $index) {
                <button
                  (click)="onPageChange($index + 1)"
                  [ngClass]="$index + 1 === page ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-600/10' : 'bg-white border-zinc-200 text-zinc-655 hover:bg-zinc-50'"
                  class="w-8 h-8 flex items-center justify-center border text-xs font-semibold rounded-lg transition-all cursor-pointer"
                >
                  {{ $index + 1 }}
                </button>
              }

              <button
                [disabled]="page === totalPages"
                (click)="onPageChange(page + 1)"
                class="p-2 border border-zinc-200 bg-white hover:bg-zinc-50 rounded-lg text-zinc-650 transition-all disabled:opacity-40 cursor-pointer"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        }
      }
    </div>
  `
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
