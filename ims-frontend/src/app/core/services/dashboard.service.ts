import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProductListDto } from './product.service';
import { StockTransactionResponseDto } from './stock.service';
import { PurchaseRequestResponseDto } from './purchase-request.service';

export interface DashboardSummaryDto {
  totalProducts: number;
  lowStockAlertItems: number;
  activeSuppliers: number;
  recentTransactions: StockTransactionResponseDto[];
  lowStockWarningProducts: ProductListDto[];
  /** All-time transaction counts by type — used for accurate doughnut chart */
  transactionTypeCounts: { [key: string]: number };
}

export interface SupplierDashboardSummaryDto {
  totalProducts: number;
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  recentOrders: PurchaseRequestResponseDto[];
  lowStockProducts: ProductListDto[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  constructor(private http: HttpClient) {}

  getSummary(startDate?: string | null, endDate?: string | null): Observable<DashboardSummaryDto> {
    let params = {};
    if (startDate) params = { ...params, startDate };
    if (endDate) params = { ...params, endDate };
    return this.http.get<DashboardSummaryDto>('api/dashboard', { params });
  }

  getSupplierSummary(startDate?: string | null, endDate?: string | null): Observable<SupplierDashboardSummaryDto> {
    let params = {};
    if (startDate) params = { ...params, startDate };
    if (endDate) params = { ...params, endDate };
    return this.http.get<SupplierDashboardSummaryDto>('api/dashboard/supplier', { params });
  }
}
