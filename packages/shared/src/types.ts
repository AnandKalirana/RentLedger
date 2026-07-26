// Cross-app contracts. Keep this file free of any Prisma/DB-specific types —
// it's the boundary between backend internals and what the frontend consumes.

export type PaymentStatus = "PENDING" | "VERIFIED" | "REJECTED";
export type PaymentLinkType = "REUSABLE" | "TENANT_SPECIFIC";
export type TenantStatus = "ACTIVE" | "INACTIVE";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  businessName?: string | null;
}

export interface TenantDTO {
  id: string;
  fullName: string;
  mobileNumber: string;
  email?: string | null;
  monthlyRent: number;
  securityDeposit: number;
  moveInDate: string; // ISO date
  rentDueDay: number;
  status: TenantStatus;
  notes?: string | null;
  createdAt: string;
}

export interface PaymentDTO {
  id: string;
  tenantId: string;
  tenantName: string;
  amount: number;
  billingMonth: number;
  billingYear: number;
  status: PaymentStatus;
  proofFileUrl: string;
  submittedName: string;
  submittedMobile: string;
  submittedEmail?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  verifiedAt?: string | null;
}

export interface PaymentLinkDTO {
  id: string;
  token: string;
  type: PaymentLinkType;
  tenantId?: string | null;
  isActive: boolean;
  expiresAt?: string | null;
  url: string; // fully-qualified public URL
}

export interface DashboardSummaryDTO {
  currentMonthRevenue: number;
  pendingPaymentsCount: number;
  verifiedPaymentsCount: number;
  totalDueAmount: number;
  activeTenantsCount: number;
  recentTransactions: PaymentDTO[];
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
