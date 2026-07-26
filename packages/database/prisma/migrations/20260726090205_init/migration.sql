-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PaymentLinkType" AS ENUM ('REUSABLE', 'TENANT_SPECIFIC');

-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "landlords" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "businessName" TEXT,
    "upiId" TEXT,
    "upiQrImageUrl" TEXT,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "landlords_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "landlordId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" TEXT,
    "ipAddress" TEXT,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "landlordId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "mobileNumber" TEXT NOT NULL,
    "email" TEXT,
    "monthlyRent" DECIMAL(10,2) NOT NULL,
    "securityDeposit" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "moveInDate" TIMESTAMP(3) NOT NULL,
    "rentDueDay" INTEGER NOT NULL DEFAULT 1,
    "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_links" (
    "id" TEXT NOT NULL,
    "landlordId" TEXT NOT NULL,
    "tenantId" TEXT,
    "token" TEXT NOT NULL,
    "type" "PaymentLinkType" NOT NULL DEFAULT 'REUSABLE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "landlordId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "paymentLinkId" TEXT,
    "submittedName" TEXT NOT NULL,
    "submittedMobile" TEXT NOT NULL,
    "submittedEmail" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "billingMonth" INTEGER NOT NULL,
    "billingYear" INTEGER NOT NULL,
    "proofFileUrl" TEXT NOT NULL,
    "proofFileType" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verifiedByLandlordId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "landlordId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "landlords_email_key" ON "landlords"("email");

-- CreateIndex
CREATE INDEX "landlords_email_idx" ON "landlords"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "refresh_tokens_landlordId_idx" ON "refresh_tokens"("landlordId");

-- CreateIndex
CREATE INDEX "tenants_landlordId_idx" ON "tenants"("landlordId");

-- CreateIndex
CREATE INDEX "tenants_landlordId_status_idx" ON "tenants"("landlordId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "payment_links_token_key" ON "payment_links"("token");

-- CreateIndex
CREATE INDEX "payment_links_landlordId_idx" ON "payment_links"("landlordId");

-- CreateIndex
CREATE INDEX "payment_links_token_idx" ON "payment_links"("token");

-- CreateIndex
CREATE INDEX "payments_landlordId_idx" ON "payments"("landlordId");

-- CreateIndex
CREATE INDEX "payments_landlordId_status_idx" ON "payments"("landlordId", "status");

-- CreateIndex
CREATE INDEX "payments_tenantId_idx" ON "payments"("tenantId");

-- CreateIndex
CREATE INDEX "payments_landlordId_billingYear_billingMonth_idx" ON "payments"("landlordId", "billingYear", "billingMonth");

-- CreateIndex
CREATE INDEX "notifications_landlordId_isRead_idx" ON "notifications"("landlordId", "isRead");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "landlords"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "landlords"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_links" ADD CONSTRAINT "payment_links_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "landlords"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_links" ADD CONSTRAINT "payment_links_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "landlords"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_paymentLinkId_fkey" FOREIGN KEY ("paymentLinkId") REFERENCES "payment_links"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "landlords"("id") ON DELETE CASCADE ON UPDATE CASCADE;
