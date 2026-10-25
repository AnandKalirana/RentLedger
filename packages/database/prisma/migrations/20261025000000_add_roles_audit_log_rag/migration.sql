-- Migration: add_roles_audit_log_rag
-- Adds:
--   1. UserRole enum + role column on landlords (default LANDLORD)
--   2. AuditLog table
--   3. ChunkSourceType / ChunkVisibility enums
--   4. DocumentChunk table with pgvector embedding column
--
-- The vector dimension is controlled by the EMBEDDING_DIM env var (default 768).
-- Because DDL inside a migration cannot read process env, the dimension is
-- baked in at 768.  To change it you must re-run the backfill after dropping
-- and recreating the index (see docs/RAG.md).

-- ──────────────────────────────────────────────────────────────────────────
-- 1. Roles
-- ──────────────────────────────────────────────────────────────────────────

CREATE TYPE "UserRole" AS ENUM ('LANDLORD', 'MANAGER', 'TENANT_VIEWER');

ALTER TABLE "landlords"
  ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'LANDLORD';

-- ──────────────────────────────────────────────────────────────────────────
-- 2. AuditLog
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE "audit_logs" (
    "id"           TEXT          NOT NULL,
    "landlordId"   TEXT          NOT NULL,
    "actorId"      TEXT          NOT NULL,
    "actorRole"    "UserRole"    NOT NULL,
    "action"       TEXT          NOT NULL,
    "resourceType" TEXT          NOT NULL,
    "resourceIds"  TEXT[]        NOT NULL DEFAULT '{}',
    "query"        TEXT,
    "createdAt"    TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "audit_logs_landlordId_createdAt_idx"
    ON "audit_logs" ("landlordId", "createdAt");

-- ──────────────────────────────────────────────────────────────────────────
-- 3. pgvector extension
-- ──────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS vector;

-- ──────────────────────────────────────────────────────────────────────────
-- 4. DocumentChunk enums + table
-- ──────────────────────────────────────────────────────────────────────────

CREATE TYPE "ChunkSourceType"  AS ENUM ('PAYMENT', 'TENANT_NOTE', 'REJECTION_REASON');
CREATE TYPE "ChunkVisibility"  AS ENUM ('LANDLORD', 'MANAGER', 'TENANT_VIEWER');

CREATE TABLE "document_chunks" (
    "id"          TEXT               NOT NULL,
    "landlordId"  TEXT               NOT NULL,
    "tenantId"    TEXT,
    "sourceType"  "ChunkSourceType"  NOT NULL,
    "sourceId"    TEXT               NOT NULL,
    "chunkIndex"  INTEGER            NOT NULL DEFAULT 0,
    "content"     TEXT               NOT NULL,
    "visibility"  "ChunkVisibility"  NOT NULL DEFAULT 'TENANT_VIEWER',
    "embedding"   vector(768),          -- dimension set by EMBEDDING_DIM (default 768)
    "createdAt"   TIMESTAMP(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3)       NOT NULL,

    CONSTRAINT "document_chunks_pkey" PRIMARY KEY ("id")
);

-- Unique constraint: idempotent re-ingestion uses upsert on this key
ALTER TABLE "document_chunks"
  ADD CONSTRAINT "document_chunks_landlordId_sourceType_sourceId_chunkIndex_key"
  UNIQUE ("landlordId", "sourceType", "sourceId", "chunkIndex");

-- Indexes for filtered ANN searches
CREATE INDEX "document_chunks_landlordId_idx"        ON "document_chunks" ("landlordId");
CREATE INDEX "document_chunks_landlordId_sourceType" ON "document_chunks" ("landlordId", "sourceType");
CREATE INDEX "document_chunks_tenantId_idx"           ON "document_chunks" ("tenantId");

-- IVFFlat vector index — partition count (lists) = sqrt(expected row count).
-- For small datasets (<10 k chunks) 100 lists is a sensible default.
-- Re-create this index (REINDEX) after a full backfill for best probe accuracy.
CREATE INDEX "document_chunks_embedding_ivfflat"
    ON "document_chunks"
    USING ivfflat ("embedding" vector_cosine_ops)
    WITH (lists = 100);
