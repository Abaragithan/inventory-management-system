import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PagedResult } from './paged-result';

export interface ProductListDto {
  productId: number;
  barcode: string;
  name: string;
  price: number;
  quantity: number;
  categoryName: string;
  supplierName: string;
  reorderLevel: number;
}

export interface ProductResponseDto {
  productId: number;
  barcode: string;
  name: string;
  description: string;
  price: number;
  costPrice: number;
  quantity: number;
  reorderLevel: number;
  createdAt: string;
  categoryId: number;
  categoryName: string;
  supplierId: number;
  supplierName: string;
}

export interface CreateProductDto {
  barcode: string;
  name: string;
  description: string;
  price: number;
  costPrice: number;
  quantity: number;
  reorderLevel: number;
  categoryId: number;
  supplierId: number;
}

export interface UpdateProductDto {
  barcode: string;
  name: string;
  description: string;
  price: number;
  costPrice: number;
  quantity: number;
  reorderLevel: number;
  categoryId: number;
  supplierId: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<ProductListDto[]> {
    return this.http.get<ProductListDto[]>('api/products');
  }

  getPaged(search: string = '', category: string = '', supplier: string = '', page: number = 1, pageSize: number = 10): Observable<PagedResult<ProductListDto>> {
    const params: any = { page: page.toString(), pageSize: pageSize.toString() };
    if (search) params.search = search;
    if (category) params.category = category;
    if (supplier) params.supplier = supplier;
    return this.http.get<PagedResult<ProductListDto>>('api/products', { params });
  }

  getById(id: number): Observable<ProductResponseDto> {
    return this.http.get<ProductResponseDto>(`api/products/${id}`);
  }

  create(dto: CreateProductDto): Observable<ProductResponseDto> {
    return this.http.post<ProductResponseDto>('api/products', dto);
  }

  update(id: number, dto: UpdateProductDto): Observable<void> {
    return this.http.put<void>(`api/products/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`api/products/${id}`);
  }
}
