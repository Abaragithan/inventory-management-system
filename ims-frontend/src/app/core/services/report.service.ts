import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  InventoryReportItem,
  TransactionReportItem,
  PurchaseRequestReportItem,
  InventoryFilters,
  TransactionFilters,
  PurchaseRequestFilters
} from '../models/report.models';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  constructor(private http: HttpClient) {}

  getInventoryReport(filters: Partial<InventoryFilters>): Observable<InventoryReportItem[]> {
    let params = new HttpParams();
    if (filters.categoryId !== undefined && filters.categoryId !== null) {
      params = params.set('categoryId', filters.categoryId.toString());
    }
    if (filters.supplierId !== undefined && filters.supplierId !== null) {
      params = params.set('supplierId', filters.supplierId.toString());
    }
    if (filters.status) {
      params = params.set('status', filters.status);
    }
    
    return this.http.get<InventoryReportItem[]>('api/reports/inventory', { params });
  }

  exportInventoryReport(filters: Partial<InventoryFilters>): Observable<Blob> {
    let params = new HttpParams();
    if (filters.categoryId !== undefined && filters.categoryId !== null) {
      params = params.set('categoryId', filters.categoryId.toString());
    }
    if (filters.supplierId !== undefined && filters.supplierId !== null) {
      params = params.set('supplierId', filters.supplierId.toString());
    }
    if (filters.status) {
      params = params.set('status', filters.status);
    }

    return this.http.get('api/reports/inventory/export', { params, responseType: 'blob' });
  }

  getTransactionReport(filters: Partial<TransactionFilters>): Observable<TransactionReportItem[]> {
    let params = new HttpParams();
    if (filters.productId !== undefined && filters.productId !== null) {
      params = params.set('productId', filters.productId.toString());
    }
    if (filters.type) {
      params = params.set('type', filters.type);
    }
    if (filters.startDate) {
      params = params.set('startDate', filters.startDate);
    }
    if (filters.endDate) {
      params = params.set('endDate', filters.endDate);
    }

    return this.http.get<TransactionReportItem[]>('api/reports/transactions', { params });
  }

  exportTransactionReport(filters: Partial<TransactionFilters>): Observable<Blob> {
    let params = new HttpParams();
    if (filters.productId !== undefined && filters.productId !== null) {
      params = params.set('productId', filters.productId.toString());
    }
    if (filters.type) {
      params = params.set('type', filters.type);
    }
    if (filters.startDate) {
      params = params.set('startDate', filters.startDate);
    }
    if (filters.endDate) {
      params = params.set('endDate', filters.endDate);
    }

    return this.http.get('api/reports/transactions/export', { params, responseType: 'blob' });
  }

  getPurchaseRequestReport(filters: Partial<PurchaseRequestFilters>): Observable<PurchaseRequestReportItem[]> {
    let params = new HttpParams();
    if (filters.supplierId !== undefined && filters.supplierId !== null) {
      params = params.set('supplierId', filters.supplierId.toString());
    }
    if (filters.status) {
      params = params.set('status', filters.status);
    }
    if (filters.startDate) {
      params = params.set('startDate', filters.startDate);
    }
    if (filters.endDate) {
      params = params.set('endDate', filters.endDate);
    }

    return this.http.get<PurchaseRequestReportItem[]>('api/reports/purchase-requests', { params });
  }

  exportPurchaseRequestReport(filters: Partial<PurchaseRequestFilters>): Observable<Blob> {
    let params = new HttpParams();
    if (filters.supplierId !== undefined && filters.supplierId !== null) {
      params = params.set('supplierId', filters.supplierId.toString());
    }
    if (filters.status) {
      params = params.set('status', filters.status);
    }
    if (filters.startDate) {
      params = params.set('startDate', filters.startDate);
    }
    if (filters.endDate) {
      params = params.set('endDate', filters.endDate);
    }

    return this.http.get('api/reports/purchase-requests/export', { params, responseType: 'blob' });
  }
}
