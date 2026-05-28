import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login.component';
import { RegisterComponent } from './features/auth/register.component';
import { PendingApprovalComponent } from './features/auth/pending-approval.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { ProductsComponent } from './features/products/products.component';
import { CategoriesComponent } from './features/categories/categories.component';
import { SuppliersComponent } from './features/suppliers/suppliers.component';
import { UsersComponent } from './features/users/users.component';
import { TransactionsComponent } from './features/transactions/transactions.component';
import { SupplierPortalComponent } from './features/supplier-portal/supplier-portal.component';
import { SupplierProfileComponent } from './features/supplier-portal/supplier-profile.component';
import { SupplierDashboardComponent } from './features/supplier-portal/supplier-dashboard.component';
import { SupplierProductsComponent } from './features/supplier-portal/supplier-products.component';
import { SupplierReportsComponent } from './features/supplier-portal/supplier-reports.component';
import { PurchaseRequestsComponent } from './features/purchase-requests/purchase-requests.component';
import { UserProfileComponent } from './features/users/user-profile.component';
import { ReportsComponent } from './features/reports/reports.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { staffGuard } from './core/guards/staff.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'pending-approval',
    component: PendingApprovalComponent,
    canActivate: [authGuard, staffGuard]
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin', 'InventoryManager'] }
  },
  {
    path: 'supplier-portal',
    redirectTo: 'supplier-portal/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'supplier-portal/dashboard',
    component: SupplierDashboardComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Supplier'] }
  },
  {
    path: 'supplier-portal/orders',
    component: SupplierPortalComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Supplier'] }
  },
  {
    path: 'supplier-portal/products',
    component: SupplierProductsComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Supplier'] }
  },
  {
    path: 'supplier-portal/reports',
    component: SupplierReportsComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Supplier'] }
  },
  {
    path: 'supplier-portal/profile',
    component: SupplierProfileComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Supplier'] }
  },
  {
    path: 'products',
    component: ProductsComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin', 'InventoryManager'] }
  },
  {
    path: 'categories',
    component: CategoriesComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin', 'InventoryManager'] }
  },
  {
    path: 'suppliers',
    component: SuppliersComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin'] }
  },
  {
    path: 'users',
    component: UsersComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin'] }
  },
  {
    path: 'transactions',
    component: TransactionsComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin', 'InventoryManager'] }
  },
  {
    path: 'purchase-requests',
    component: PurchaseRequestsComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin', 'InventoryManager'] }
  },
  {
    path: 'reports',
    component: ReportsComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin', 'InventoryManager'] }
  },
  {
    path: 'profile',
    component: UserProfileComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin', 'InventoryManager'] }
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' }
];
