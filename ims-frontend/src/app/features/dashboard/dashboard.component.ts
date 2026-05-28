import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DashboardService, DashboardSummaryDto } from '../../core/services/dashboard.service';
import { StockService, StockTransactionResponseDto } from '../../core/services/stock.service';
import { ProductService, ProductListDto } from '../../core/services/product.service';
import { AuthService } from '../../core/services/auth.service';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, SkeletonComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly stockService = inject(StockService);
  private readonly productService = inject(ProductService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly summary = signal<DashboardSummaryDto | null>(null);
  readonly isLoading = signal(true);
  readonly isChartLoaded = signal(false);
  readonly selectedDateRange = signal('all');

  // Hover states for tooltips/highlights
  readonly hoveredPoint = signal<number | null>(null);
  readonly hoveredDoughnut = signal<string | null>(null);

  // Quick adjustment modal states
  readonly isModalOpen = signal(false);
  readonly isSubmittingTx = signal(false);
  readonly isProductDropdownOpen = signal(false);
  readonly productSearchQuery = signal('');
  readonly products = signal<ProductListDto[]>([]);
  readonly selectedProductId = signal<number>(0);

  txForm!: FormGroup;

  readonly userRole = computed(() => this.authService.getUserRole());
  readonly userEmail = computed(() => this.authService.currentUser()?.email || '');

  getDateBounds(): { startDate: string | null, endDate: string | null } {
    const now = new Date();
    let startDate: Date | null = null;

    switch (this.selectedDateRange()) {
      case 'last-week':
        startDate = new Date();
        startDate.setDate(now.getDate() - 7);
        break;
      case 'last-month':
        startDate = new Date();
        startDate.setDate(now.getDate() - 30);
        break;
      case 'last-3-months':
        startDate = new Date();
        startDate.setDate(now.getDate() - 90);
        break;
      case 'last-1-year':
        startDate = new Date();
        startDate.setDate(now.getDate() - 365);
        break;
      case 'all':
      default:
        return { startDate: null, endDate: null };
    }

    return {
      startDate: startDate.toISOString(),
      endDate: now.toISOString()
    };
  }

  onDateRangeChange(): void {
    this.loadDashboardData();
  }

  readonly selectedProduct = computed(() => {
    return this.products().find(p => p.productId === this.selectedProductId()) || null;
  });

  readonly filteredCatalogProducts = computed(() => {
    const query = this.productSearchQuery().toLowerCase().trim();
    if (!query) return this.products();
    return this.products().filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.barcode.toLowerCase().includes(query)
    );
  });

  readonly typeOptions = [
    {
      value: 'StockIn',
      label: 'Stock In',
      activeClass: 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm shadow-emerald-500/5',
      icon: `<svg class="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>`
    },
    {
      value: 'StockOut',
      label: 'Stock Out',
      activeClass: 'bg-rose-50 border-rose-300 text-rose-700 shadow-sm shadow-rose-500/5',
      icon: `<svg class="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" /></svg>`
    },
    {
      value: 'Adjustment',
      label: 'Adjustment',
      activeClass: 'bg-amber-50 border-amber-300 text-amber-700 shadow-sm shadow-amber-500/5',
      icon: `<svg class="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>`
    },
    {
      value: 'Return',
      label: 'Return',
      activeClass: 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm shadow-blue-500/5',
      icon: `<svg class="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>`
    }
  ];

  // SVG Chart: computed data trend coordinates
  readonly trendPoints = computed(() => {
    const txs = this.summary()?.recentTransactions || [];
    if (txs.length === 0) {
      // Clean dummy fallback curve
      return [
        { x: 40, y: 150, value: 0, type: 'N/A', label: 'No logs', date: '' },
        { x: 150, y: 130, value: 5, type: 'N/A', label: 'No logs', date: '' },
        { x: 260, y: 140, value: 2, type: 'N/A', label: 'No logs', date: '' },
        { x: 370, y: 100, value: 8, type: 'N/A', label: 'No logs', date: '' },
        { x: 480, y: 80, value: 12, type: 'N/A', label: 'No logs', date: '' }
      ];
    }

    const list = [...txs].slice(0, 7).reverse(); // max last 7 points chronologically
    const values = list.map(t => Math.abs(t.quantity));
    const maxVal = Math.max(...values, 10);

    const paddingLeft = 45;
    const paddingRight = 20;
    const width = 500 - paddingLeft - paddingRight; // 435
    const height = 200;
    const paddingTop = 30;
    const paddingBottom = 40;
    const plotHeight = height - paddingTop - paddingBottom; // 130

    return list.map((t, i) => {
      const x = paddingLeft + (i * (width / (list.length - 1 || 1)));
      const y = height - paddingBottom - ((Math.abs(t.quantity) / maxVal) * plotHeight);
      return {
        x,
        y,
        value: t.quantity,
        type: t.type,
        label: t.productName,
        date: new Date(t.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      };
    });
  });

  readonly areaPathMarkup = computed(() => {
    const pts = this.trendPoints();
    if (pts.length < 2) return '';
    const first = pts[0];
    const last = pts[pts.length - 1];
    const bottomY = 160; // baseline height (200 - paddingBottom)

    let d = `M ${first.x} ${bottomY}`;
    pts.forEach(p => {
      d += ` L ${p.x} ${p.y}`;
    });
    d += ` L ${last.x} ${bottomY} Z`;
    return d;
  });

  readonly linePathMarkup = computed(() => {
    const pts = this.trendPoints();
    if (pts.length < 2) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      d += ` L ${pts[i].x} ${pts[i].y}`;
    }
    return d;
  });

  readonly gridLines = computed(() => {
    const txs = this.summary()?.recentTransactions || [];
    const values = txs.map(t => Math.abs(t.quantity));
    const maxVal = Math.max(...values, 10);

    const height = 200;
    const paddingTop = 30;
    const paddingBottom = 40;
    const plotHeight = height - paddingTop - paddingBottom; // 130

    return [
      { y: height - paddingBottom, label: '0' },
      { y: height - paddingBottom - (0.5 * plotHeight), label: Math.round(maxVal / 2).toString() },
      { y: height - paddingBottom - plotHeight, label: maxVal.toString() }
    ];
  });

  // SVG Chart: computed circular doughnut segments — uses ALL-TIME counts from backend
  readonly doughnutSegments = computed(() => {
    const allTimeCounts = this.summary()?.transactionTypeCounts;
    const counts = {
      StockIn:    allTimeCounts?.['StockIn']    ?? 0,
      StockOut:   allTimeCounts?.['StockOut']   ?? 0,
      Adjustment: allTimeCounts?.['Adjustment'] ?? 0,
      Return:     allTimeCounts?.['Return']     ?? 0
    };

    const total = counts.StockIn + counts.StockOut + counts.Adjustment + counts.Return;
    const types: ('StockIn' | 'StockOut' | 'Adjustment' | 'Return')[] = ['StockIn', 'StockOut', 'Adjustment', 'Return'];
    const colors = { StockIn: '#10b981', StockOut: '#f43f5e', Adjustment: '#f59e0b', Return: '#3b82f6' };
    const labels = { StockIn: 'Stock In', StockOut: 'Stock Out', Adjustment: 'Adjustment', Return: 'Return' };

    if (total === 0) {
      // Default fallback — equal quarters when no data exists
      return [
        { type: 'StockIn',    percentage: 25, offset: 377 * 0.75, angle: -90,  color: colors.StockIn,    label: labels.StockIn    },
        { type: 'StockOut',   percentage: 25, offset: 377 * 0.75, angle: 0,    color: colors.StockOut,   label: labels.StockOut   },
        { type: 'Adjustment', percentage: 25, offset: 377 * 0.75, angle: 90,   color: colors.Adjustment, label: labels.Adjustment },
        { type: 'Return',     percentage: 25, offset: 377 * 0.75, angle: 180,  color: colors.Return,     label: labels.Return     },
      ];
    }

    const segments = [];
    let runningPercent = 0;

    for (const type of types) {
      const count = counts[type];
      if (count > 0) {
        const pct = count / total;
        const strokeLength = pct * 377;
        const offset = 377 - strokeLength;
        const angle = (runningPercent * 360) - 90; // Start at 12 o'clock
        segments.push({
          type,
          percentage: Math.round(pct * 100),
          offset,
          angle,
          color: colors[type],
          label: labels[type],
          count  // include raw count for tooltip display
        });
        runningPercent += pct;
      }
    }
    return segments;
  });


  ngOnInit(): void {
    this.txForm = this.fb.group({
      productId: [0, [Validators.required, Validators.min(1)]],
      type: ['StockIn', [Validators.required]],
      quantity: [1, [Validators.required, Validators.min(1)]],
      notes: ['']
    });

    this.loadDashboardData();
    this.loadCatalog();
  }

  loadDashboardData(): void {
    this.isLoading.set(true);
    this.isChartLoaded.set(false);
    const { startDate, endDate } = this.getDateBounds();
    this.dashboardService.getSummary(startDate, endDate).subscribe({
      next: (res) => {
        this.summary.set(res);
        this.isLoading.set(false);
        // Delay slightly to trigger the SVG CSS transition animation
        setTimeout(() => {
          this.isChartLoaded.set(true);
        }, 50);
      },
      error: () => {
        this.toastService.error('Failed to load dashboard summaries.');
        this.isLoading.set(false);
      }
    });
  }

  loadCatalog(): void {
    this.productService.getAll().subscribe({
      next: (res) => this.products.set(res),
      error: () => this.toastService.error('Failed to load catalog products.')
    });
  }

  openTransactionModal(): void {
    this.isModalOpen.set(true);
  }

  closeTransactionModal(): void {
    this.isModalOpen.set(false);
    this.isProductDropdownOpen.set(false);
    this.productSearchQuery.set('');
    this.selectedProductId.set(0);
    this.txForm.reset({
      productId: 0,
      type: 'StockIn',
      quantity: 1,
      notes: ''
    });
  }

  selectProduct(prod: ProductListDto): void {
    this.selectedProductId.set(prod.productId);
    this.txForm.patchValue({ productId: prod.productId });
    this.txForm.get('productId')?.markAsTouched();
    this.isProductDropdownOpen.set(false);
    this.productSearchQuery.set('');
  }

  setTxType(type: string): void {
    this.txForm.patchValue({ type });
    const quantityControl = this.txForm.get('quantity');
    if (quantityControl) {
      if (type === 'Adjustment') {
        quantityControl.setValidators([Validators.required, (control) => control.value === 0 ? { zeroQuantity: true } : null]);
      } else {
        quantityControl.setValidators([Validators.required, Validators.min(1)]);
      }
      quantityControl.updateValueAndValidity();
    }
  }

  onSubmitTransaction(): void {
    if (this.txForm.invalid) return;

    this.isSubmittingTx.set(true);
    this.stockService.recordTransaction(this.txForm.value).subscribe({
      next: () => {
        this.toastService.success('Stock level adjusted successfully!');
        this.isSubmittingTx.set(false);
        this.closeTransactionModal();
        this.loadDashboardData();
        this.loadCatalog(); // Refresh quantity badges
      },
      error: (err) => {
        this.isSubmittingTx.set(false);
        const msg = err.error?.message || err.error || 'Failed to adjust stock.';
        this.toastService.error(msg);
      }
    });
  }

  getTransactionBadgeClass(type: string): string {
    switch (type) {
      case 'StockIn':
        return 'bg-emerald-50 border border-emerald-200 text-emerald-700';
      case 'StockOut':
        return 'bg-rose-50 border border-rose-200 text-rose-700';
      case 'Adjustment':
        return 'bg-amber-50 border border-amber-200 text-amber-700';
      case 'Return':
        return 'bg-blue-50 border border-blue-200 text-blue-700';
      default:
        return 'bg-zinc-50 border border-zinc-200 text-zinc-500';
    }
  }

  getTransactionSign(tx: StockTransactionResponseDto): string {
    if (tx.type === 'StockIn' || tx.type === 'Return') {
      return '+';
    }
    if (tx.type === 'StockOut') {
      return '-';
    }
    return tx.quantity >= 0 ? '+' : '-';
  }

  getTransactionQuantity(tx: StockTransactionResponseDto): number {
    return Math.abs(tx.quantity);
  }
}
