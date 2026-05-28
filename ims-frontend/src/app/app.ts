import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { SupplierSidebarComponent } from './features/supplier-portal/supplier-sidebar.component';
import { HeaderComponent } from './shared/components/header/header.component';
import { ToastComponent } from './shared/components/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, SupplierSidebarComponent, HeaderComponent, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly authService = inject(AuthService);
}
