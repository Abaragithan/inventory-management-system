import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PagedResult } from './paged-result';

export interface StockTransactionResponseDto {
  transactionId: number;
  productId: number;
  productName: string;
  userId: number;
  userEmail: string;
  type: string;
  quantity: number;
  notes: string | null;
  createdAt: string;
}

export interface CreateStockTransactionDto {
  productId: number;
  type: string; // "StockIn" | "StockOut" | "Adjustment" | "Return"
  quantity: number;
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class StockService {
  constructor(private http: HttpClient) {}

  recordTransaction(dto: CreateStockTransactionDto): Observable<StockTransactionResponseDto> {
    return this.http.post<StockTransactionResponseDto>('api/stocktransactions', dto);
  }

  getRecent(limit: number = 50): Observable<StockTransactionResponseDto[]> {
    return this.http.get<StockTransactionResponseDto[]>(`api/stocktransactions?limit=${limit}`);
  }

  getPaged(search: string = '', type: string = '', page: number = 1, pageSize: number = 10, limit: number = 50): Observable<PagedResult<StockTransactionResponseDto>> {
    const params: any = { page: page.toString(), pageSize: pageSize.toString(), limit: limit.toString() };
    if (search) params.search = search;
    if (type) params.type = type;
    return this.http.get<PagedResult<StockTransactionResponseDto>>('api/stocktransactions', { params });
  }
}
