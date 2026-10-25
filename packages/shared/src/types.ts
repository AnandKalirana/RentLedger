// Cross-app contracts. Keep this file free of any Prisma/DB-specific types —
// it's the boundary between backend internals and what the frontend consumes.

export type PaymentStatus = "PENDING" | "VERIFIED" | "REJECTED";
export type PaymentLinkType = "REUSABLE" | "TENANT_SPECIFIC";
export type TenantStatus = "ACTIVE" | "INACTIVE";

/**
 * Role hierarchy — LANDLORD has the most access, TENANT_VIEWER the least.
 * Encoded as a numeric ordering so permission checks can use simple <= comparisons.
 */
export type UserRole = "LANDLORD" | "MANAGER" | "TENANT_VIEWER";

/** Numeric order — lower number = more access. */
export const ROLE_ORDER: Record<UserRole, number> = {
  LANDLORD: 0,
  MANAGER: 1,
  TENANT_VIEWER: 2,
} as const;

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  businessName?: string | null;
  role: UserRole;
}

export interface TenantDTO {
  id: string;
  fullName: string;
  mobileNumber: string;
  email?: string | null;
  monthlyRent: number;
  monthlyMaintenance?: number;
  securityDeposit: number;
  moveInDate: string; // ISO date
  rentDueDay: number;
  status: TenantStatus;
  leaseDocumentUrl?: string | null;
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

// ---------------------------------------------------------------------------
// RAG & Assistant Types
// ---------------------------------------------------------------------------

export type ChunkSourceType = "PAYMENT" | "TENANT_NOTE" | "REJECTION_REASON";
export type ChunkVisibility = "LANDLORD" | "MANAGER" | "TENANT_VIEWER";

export interface ChatSourceCitation {
  chunkId: string;
  sourceType: ChunkSourceType;
  sourceId: string;
  tenantId?: string | null;
  snippet: string;
}

export interface ChatMessageDTO {
  role: "user" | "assistant";
  content: string;
  citations?: ChatSourceCitation[];
  createdAt?: string;
}
