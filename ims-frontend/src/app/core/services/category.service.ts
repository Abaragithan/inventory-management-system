import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PagedResult } from './paged-result';

export interface CategoryDto {
  categoryId: number;
  name: string;
  description: string;
}

export interface CreateCategoryDto {
  name: string;
  description: string;
}

export interface UpdateCategoryDto {
  name: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<CategoryDto[]> {
    return this.http.get<CategoryDto[]>('api/categories');
  }

  getPaged(search: string = '', page: number = 1, pageSize: number = 6): Observable<PagedResult<CategoryDto>> {
    const params: any = { page: page.toString(), pageSize: pageSize.toString() };
    if (search) {
      params.search = search;
    }
    return this.http.get<PagedResult<CategoryDto>>('api/categories', { params });
  }

  getById(id: number): Observable<CategoryDto> {
    return this.http.get<CategoryDto>(`api/categories/${id}`);
  }

  create(dto: CreateCategoryDto): Observable<CategoryDto> {
    return this.http.post<CategoryDto>('api/categories', dto);
  }

  update(id: number, dto: UpdateCategoryDto): Observable<void> {
    return this.http.put<void>(`api/categories/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`api/categories/${id}`);
  }
}
