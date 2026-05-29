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
  templateUrl: './report-kpi-cards.component.html'
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
