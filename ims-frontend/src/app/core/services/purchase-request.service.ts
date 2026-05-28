import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PagedResult } from './paged-result';

export interface CreatePurchaseRequestItemDto {
  productId: number;
  requestedQuantity: number;
  unitCost: number;
  notes?: string;
}

export interface CreatePurchaseRequestDto {
  supplierId: number;
  notes?: string;
  expectedDeliveryDate?: string | null;
  purchaseRequestItems: CreatePurchaseRequestItemDto[];
}

export interface PurchaseRequestItemResponseDto {
  requestItemId: number;
  requestId: number;
  productId: number;
  productName: string;
  productBarcode: string;
  requestedQuantity: number;
  deliveredQuantity: number | null;
  unitCost: number;
  notes: string;
  isReceived: boolean;
}

export interface PurchaseRequestResponseDto {
  requestId: number;
  supplierId: number;
  supplierCompanyName: string;
  requestedByUserId: number;
  requestedByUserEmail: string;
  requestNumber: string;
  requestStatus: 'Pending' | 'Accepted' | 'Delivered' | 'Rejected' | 'Cancelled';
  notes: string;
  requestedDate: string;
  expectedDeliveryDate: string | null;
  deliveredDate: string | null;
  isActive: boolean;
  purchaseRequestItems: PurchaseRequestItemResponseDto[];
}

export interface PurchaseRequestSuggestionItemDto {
  productId: number;
  productName: string;
  productBarcode: string;
  currentQuantity: number;
  reorderLevel: number;
  suggestedQuantity: number;
  unitCost: number;
}

export interface PurchaseRequestSuggestionDto {
  supplierId: number;
  supplierCompanyName: string;
  items: PurchaseRequestSuggestionItemDto[];
}

export interface ReceivePurchaseRequestItemDto {
  requestItemId: number;
  deliveredQuantity: number;
  notes?: string;
}

export interface ReceivePurchaseRequestDto {
  items: ReceivePurchaseRequestItemDto[];
}

export interface UpdatePurchaseRequestStatusDto {
  requestStatus: 'Accepted' | 'Rejected';
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PurchaseRequestService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<PurchaseRequestResponseDto[]> {
    return this.http.get<PurchaseRequestResponseDto[]>('api/purchaseRequests');
  }

  getPaged(search: string = '', status: string = '', supplierId: string | number = '', page: number = 1, pageSize: number = 10): Observable<PagedResult<PurchaseRequestResponseDto>> {
    const params: any = { page: page.toString(), pageSize: pageSize.toString() };
    if (search) params.search = search;
    if (status) params.status = status;
    if (supplierId) params.supplierId = supplierId.toString();
    return this.http.get<PagedResult<PurchaseRequestResponseDto>>('api/purchaseRequests', { params });
  }

  getById(id: number): Observable<PurchaseRequestResponseDto> {
    return this.http.get<PurchaseRequestResponseDto>(`api/purchaseRequests/${id}`);
  }

  create(dto: CreatePurchaseRequestDto): Observable<PurchaseRequestResponseDto> {
    return this.http.post<PurchaseRequestResponseDto>('api/purchaseRequests', dto);
  }

  updateStatus(id: number, status: 'Accepted' | 'Rejected', notes?: string): Observable<void> {
    const dto: UpdatePurchaseRequestStatusDto = { requestStatus: status, notes };
    return this.http.put<void>(`api/purchaseRequests/${id}/status`, dto);
  }

  receive(id: number, dto: ReceivePurchaseRequestDto): Observable<void> {
    return this.http.put<void>(`api/purchaseRequests/${id}/receive`, dto);
  }

  cancel(id: number): Observable<void> {
    return this.http.put<void>(`api/purchaseRequests/${id}/cancel`, {});
  }

  getSuggestions(): Observable<PurchaseRequestSuggestionDto[]> {
    return this.http.get<PurchaseRequestSuggestionDto[]>('api/purchaseRequests/suggestions');
  }
}
