import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PagedResult } from './paged-result';

export interface SupplierListDto {
  supplierId: number;
  companyName: string;
  contactPerson: string;
  isActive: boolean;
  createdAt: string;
}

export interface SupplierResponseDto {
  supplierId: number;
  userId: number;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateSupplierDto {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
}

export interface UpdateSupplierDto {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SupplierService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<SupplierResponseDto[]> {
    // Return the detailed model so we display contact details on suppliers page
    return this.http.get<SupplierResponseDto[]>('api/suppliers');
  }

  getPaged(search: string = '', status: string = '', page: number = 1, pageSize: number = 6): Observable<PagedResult<SupplierResponseDto>> {
    const params: any = { page: page.toString(), pageSize: pageSize.toString() };
    if (search) params.search = search;
    if (status) params.status = status;
    return this.http.get<PagedResult<SupplierResponseDto>>('api/suppliers', { params });
  }

  getById(id: number): Observable<SupplierResponseDto> {
    return this.http.get<SupplierResponseDto>(`api/suppliers/${id}`);
  }

  create(userId: number, dto: CreateSupplierDto): Observable<SupplierResponseDto> {
    return this.http.post<SupplierResponseDto>(`api/suppliers/${userId}`, dto);
  }

  update(id: number, dto: UpdateSupplierDto): Observable<void> {
    return this.http.put<void>(`api/suppliers/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`api/suppliers/${id}`);
  }

  getMyProfile(): Observable<SupplierResponseDto> {
    return this.http.get<SupplierResponseDto>('api/suppliers/my-profile');
  }

  updateMyProfile(dto: UpdateSupplierDto): Observable<void> {
    return this.http.put<void>('api/suppliers/my-profile', dto);
  }
}
