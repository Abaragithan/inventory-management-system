import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PagedResult } from './paged-result';

export interface UserResponseDto {
  userId: number;
  email: string;
  role: string;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
}

export interface CreateUserDto {
  email: string;
  passwordHash?: string;
  password?: string;
  confirmPassword?: string;
  role: string;
}

export interface UpdateUserDto {
  email: string;
  role: string;
  isActive: boolean;
  isEmailVerified: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<UserResponseDto[]> {
    return this.http.get<UserResponseDto[]>('api/users');
  }

  getPaged(search: string = '', role: string = '', page: number = 1, pageSize: number = 10): Observable<PagedResult<UserResponseDto>> {
    const params: any = { page: page.toString(), pageSize: pageSize.toString() };
    if (search) params.search = search;
    if (role) params.role = role;
    return this.http.get<PagedResult<UserResponseDto>>('api/users', { params });
  }

  getById(id: number): Observable<UserResponseDto> {
    return this.http.get<UserResponseDto>(`api/users/${id}`);
  }

  create(dto: any): Observable<UserResponseDto> {
    return this.http.post<UserResponseDto>('api/users', dto);
  }

  update(id: number, dto: UpdateUserDto): Observable<void> {
    return this.http.put<void>(`api/users/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`api/users/${id}`);
  }

  getUnassignedSuppliers(): Observable<UserResponseDto[]> {
    return this.http.get<UserResponseDto[]>('api/users/unassigned-suppliers');
  }

  getMyProfile(): Observable<UserResponseDto> {
    return this.http.get<UserResponseDto>('api/profile');
  }

  changePassword(dto: { currentPassword: string; newPassword: string; confirmNewPassword: string }): Observable<void> {
    return this.http.put<void>('api/profile/change-password', dto);
  }
}
