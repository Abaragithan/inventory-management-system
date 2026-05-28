import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportType } from '../../../core/models/report.models';

export interface InventoryReportStats {
  skuCount: number;
  totalQty: number;
  lowStockCount: number;
  valuation: number;
}

export interface TransactionReportStats {
  totalCount: number;
  qtyMoved: number;
  inCount: number;
  outCount: number;
  adjCount: number;
  retCount: number;
}

export interface PurchaseRequestReportStats {
  totalCount: number;
  pendingCount: number;
  deliveredCount: number;
  spendValue: number;
}

@Component({
  selector: 'app-report-kpi-cards',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4 print:mb-6">
      <!-- Inventory KPIs -->
      @if (activeTab === 'inventory') {
        <div class="bg-white border border-zinc-200/80 p-5 rounded-2xl shadow-sm print:border-zinc-300">
          <span class="text-xs text-zinc-400 font-semibold uppercase tracking-wide">Total Catalog SKUs</span>
          <h3 class="text-2xl font-bold text-zinc-950 mt-1 print:text-xl">{{ inventoryStats.skuCount }}</h3>
        </div>
        <div class="bg-white border border-zinc-200/80 p-5 rounded-2xl shadow-sm print:border-zinc-300">
          <span class="text-xs text-zinc-400 font-semibold uppercase tracking-wide">Total Qty on Hand</span>
          <h3 class="text-2xl font-bold text-zinc-950 mt-1 print:text-xl">{{ inventoryStats.totalQty | number }}</h3>
        </div>
        <div class="bg-white border border-zinc-200/80 p-5 rounded-2xl shadow-sm print:border-zinc-300">
          <span class="text-xs text-zinc-400 font-semibold uppercase tracking-wide">Low Stock Alert Items</span>
          <h3 class="text-2xl font-bold mt-1 print:text-xl" [class.text-rose-600]="inventoryStats.lowStockCount > 0" [class.text-zinc-950]="inventoryStats.lowStockCount === 0">
            {{ inventoryStats.lowStockCount }}
          </h3>
        </div>
        <div class="bg-white border border-zinc-200/80 p-5 rounded-2xl shadow-sm print:border-zinc-300">
          <span class="text-xs text-zinc-400 font-semibold uppercase tracking-wide">Valuation (at Cost Price)</span>
          <h3 class="text-2xl font-bold text-blue-600 mt-1 print:text-xl">LKR {{ inventoryStats.valuation | number:'1.2-2' }}</h3>
        </div>
      }

      <!-- Transaction KPIs -->
      @if (activeTab === 'transactions') {
        <div class="bg-white border border-zinc-200/80 p-5 rounded-2xl shadow-sm print:border-zinc-300">
          <span class="text-xs text-zinc-400 font-semibold uppercase tracking-wide">Total Transactions</span>
          <h3 class="text-2xl font-bold text-zinc-950 mt-1 print:text-xl">{{ transactionStats.totalCount }}</h3>
        </div>
        <div class="bg-white border border-zinc-200/80 p-5 rounded-2xl shadow-sm print:border-zinc-300">
          <span class="text-xs text-zinc-400 font-semibold uppercase tracking-wide">Total Units Transferred</span>
          <h3 class="text-2xl font-bold text-zinc-950 mt-1 print:text-xl">{{ transactionStats.qtyMoved | number }}</h3>
        </div>
        <div class="bg-white border border-zinc-200/80 p-5 rounded-2xl shadow-sm print:border-zinc-300">
          <span class="text-xs text-zinc-400 font-semibold uppercase tracking-wide">In vs Out Movements</span>
          <h3 class="text-2xl font-bold text-zinc-950 mt-1 print:text-xl">
            <span class="text-emerald-600">+{{ transactionStats.inCount }}</span>
            <span class="text-zinc-300 px-1.5">/</span>
            <span class="text-rose-600">-{{ transactionStats.outCount }}</span>
          </h3>
        </div>
        <div class="bg-white border border-zinc-200/80 p-5 rounded-2xl shadow-sm print:border-zinc-300">
          <span class="text-xs text-zinc-400 font-semibold uppercase tracking-wide">Adjust / Return Counts</span>
          <h3 class="text-2xl font-bold text-amber-600 mt-1 print:text-xl">
            {{ transactionStats.adjCount }} <span class="text-xs text-zinc-400 font-normal">adj</span> / {{ transactionStats.retCount }} <span class="text-xs text-zinc-400 font-normal">ret</span>
          </h3>
        </div>
      }

      <!-- Purchase Requests KPIs -->
      @if (activeTab === 'purchase-requests') {
        <div class="bg-white border border-zinc-200/80 p-5 rounded-2xl shadow-sm print:border-zinc-300">
          <span class="text-xs text-zinc-400 font-semibold uppercase tracking-wide">Total Requests</span>
          <h3 class="text-2xl font-bold text-zinc-950 mt-1 print:text-xl">{{ purchaseRequestStats.totalCount }}</h3>
        </div>
        <div class="bg-white border border-zinc-200/80 p-5 rounded-2xl shadow-sm print:border-zinc-300">
          <span class="text-xs text-zinc-400 font-semibold uppercase tracking-wide">Pending Approval</span>
          <h3 class="text-2xl font-bold mt-1 print:text-xl" [class.text-amber-600]="purchaseRequestStats.pendingCount > 0" [class.text-zinc-950]="purchaseRequestStats.pendingCount === 0">
            {{ purchaseRequestStats.pendingCount }}
          </h3>
        </div>
        <div class="bg-white border border-zinc-200/80 p-5 rounded-2xl shadow-sm print:border-zinc-300">
          <span class="text-xs text-zinc-400 font-semibold uppercase tracking-wide">Completed (Delivered)</span>
          <h3 class="text-2xl font-bold text-emerald-600 mt-1 print:text-xl">{{ purchaseRequestStats.deliveredCount }}</h3>
        </div>
        <div class="bg-white border border-zinc-200/80 p-5 rounded-2xl shadow-sm print:border-zinc-300">
          <span class="text-xs text-zinc-400 font-semibold uppercase tracking-wide">Total Spend Value</span>
          <h3 class="text-2xl font-bold text-blue-600 mt-1 print:text-xl">LKR {{ purchaseRequestStats.spendValue | number:'1.2-2' }}</h3>
        </div>
      }
    </div>
  `
})
export class ReportKpiCardsComponent {
  @Input() activeTab: ReportType = 'inventory';

  @Input() inventoryStats: InventoryReportStats = {
    skuCount: 0,
    totalQty: 0,
    lowStockCount: 0,
    valuation: 0
  };

  @Input() transactionStats: TransactionReportStats = {
    totalCount: 0,
    qtyMoved: 0,
    inCount: 0,
    outCount: 0,
    adjCount: 0,
    retCount: 0
  };

  @Input() purchaseRequestStats: PurchaseRequestReportStats = {
    totalCount: 0,
    pendingCount: 0,
    deliveredCount: 0,
    spendValue: 0
  };
}
