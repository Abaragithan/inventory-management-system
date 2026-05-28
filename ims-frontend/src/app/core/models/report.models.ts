export type ReportType = 'inventory' | 'transactions' | 'purchase-requests';

export interface InventoryReportItem {
  productId: number;
  barcode: string;
  productName: string;
  categoryName: string;
  supplierName: string;
  price: number;
  costPrice: number;
  quantity: number;
  reorderLevel: number;
  totalValue: number;
  totalCostValue: number;
  isLowStock: boolean;
}

export interface TransactionReportItem {
  transactionId: number;
  productId: number;
  productBarcode: string;
  productName: string;
  type: string;
  quantity: number;
  userEmail: string;
  notes: string | null;
  createdAt: string;
}

export interface PurchaseRequestReportItem {
  requestId: number;
  requestNumber: string;
  requestedByUserEmail: string;
  supplierCompanyName: string;
  status: string;
  requestedDate: string;
  expectedDeliveryDate: string | null;
  deliveredDate: string | null;
  itemCount: number;
  totalCost: number;
  notes: string;
}

export interface InventoryFilters {
  categoryId: number | null;
  supplierId: number | null;
  status: string;
}

export interface TransactionFilters {
  productId: number | null;
  type: string;
  startDate: string | null;
  endDate: string | null;
}

export interface PurchaseRequestFilters {
  supplierId: number | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
}
