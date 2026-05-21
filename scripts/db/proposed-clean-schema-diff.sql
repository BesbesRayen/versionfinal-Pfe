-- CreadiTN proposed clean schema diff.
-- Generated during STEP 2 database audit.
-- IMPORTANT: proposal only. Do not run blindly.
-- Apply only after a DB backup and after related code changes are ready.

-- ---------------------------------------------------------------------------
-- Phase 0: preflight checks
-- ---------------------------------------------------------------------------

-- Rows that would block adding FK transactions.user_id -> users.id
SELECT t.id, t.user_id
FROM transactions t
LEFT JOIN users u ON u.id = t.user_id
WHERE u.id IS NULL;

-- Rows that would block adding FK user_wallet.user_id -> users.id
SELECT w.id, w.user_id
FROM user_wallet w
LEFT JOIN users u ON u.id = w.user_id
WHERE u.id IS NULL;

-- Rows that would block adding FK admin_notifications.order_id -> purchase_orders.id
SELECT n.id, n.order_id
FROM admin_notifications n
LEFT JOIN purchase_orders po ON po.id = n.order_id
WHERE n.order_id IS NOT NULL
  AND po.id IS NULL;

-- ---------------------------------------------------------------------------
-- Phase A: relational integrity and query-performance improvements
-- Can be applied before table renames if preflight checks return no rows.
-- ---------------------------------------------------------------------------

ALTER TABLE transactions
  ADD CONSTRAINT fk_transactions_user
  FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE user_wallet
  ADD CONSTRAINT fk_user_wallet_user
  FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE admin_notifications
  ADD CONSTRAINT fk_admin_notifications_order
  FOREIGN KEY (order_id) REFERENCES purchase_orders(id);

CREATE INDEX idx_messages_status_created_at
  ON messages (status, created_at);

CREATE INDEX idx_notifications_user_read_created_at
  ON notifications (user_id, is_read, created_at);

CREATE INDEX idx_installments_status_due_date
  ON installments (status, due_date);

CREATE INDEX idx_credit_requests_user_status
  ON credit_requests (user_id, status);

CREATE INDEX idx_articles_active_category
  ON articles (active, category);

CREATE INDEX idx_kyc_documents_identity_number
  ON kyc_documents (extracted_identity_number);

CREATE INDEX idx_kyc_audit_logs_document_created_at
  ON kyc_audit_logs (kyc_document_id, created_at);

-- ---------------------------------------------------------------------------
-- Phase B: naming cleanup requiring code updates
-- Required code changes:
-- - UserWallet entity @Table("user_wallets")
-- - UserWalletRepository/service SQL references
-- - Next contact/messages queries from messages -> contact_messages
-- - Admin messages page route remains OK if API route is updated
-- ---------------------------------------------------------------------------

RENAME TABLE user_wallet TO user_wallets;
RENAME TABLE messages TO contact_messages;

ALTER TABLE contact_messages
  MODIFY status ENUM('unread','read','replied') NOT NULL DEFAULT 'unread';

-- Optional: rename FK after user_wallets rename if supported/desired.
-- MySQL keeps constraint names globally scoped; use explicit drop/add if needed.
-- ALTER TABLE user_wallets DROP FOREIGN KEY fk_user_wallet_user;
-- ALTER TABLE user_wallets
--   ADD CONSTRAINT fk_user_wallets_user
--   FOREIGN KEY (user_id) REFERENCES users(id);

-- ---------------------------------------------------------------------------
-- Phase C: remove orphan columns after backup and final confirmation
-- These columns are present in the live DB but not mapped or referenced by
-- the current backend code audited in STEP 2.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS cleanup_backup_users_orphan_columns AS
SELECT id, birth_date, gender, kyc_verified, kyc_verified_at
FROM users
WHERE birth_date IS NOT NULL
   OR gender IS NOT NULL
   OR kyc_verified IS NOT NULL
   OR kyc_verified_at IS NOT NULL;

ALTER TABLE users
  DROP COLUMN birth_date,
  DROP COLUMN gender,
  DROP COLUMN kyc_verified,
  DROP COLUMN kyc_verified_at;

CREATE TABLE IF NOT EXISTS cleanup_backup_kyc_document_orphan_columns AS
SELECT
  id,
  birth_date_matched,
  cin_matched,
  document_confidence,
  document_face_match_score,
  document_valid,
  extracted_birth_date,
  extracted_cin,
  extracted_gender,
  face_matched,
  first_name_matched,
  gender_matched,
  last_name_matched,
  provider_reference,
  reviewed_at,
  submitted_cin
FROM kyc_documents
WHERE birth_date_matched IS NOT NULL
   OR cin_matched IS NOT NULL
   OR document_confidence IS NOT NULL
   OR document_face_match_score IS NOT NULL
   OR document_valid IS NOT NULL
   OR extracted_birth_date IS NOT NULL
   OR extracted_cin IS NOT NULL
   OR extracted_gender IS NOT NULL
   OR face_matched IS NOT NULL
   OR first_name_matched IS NOT NULL
   OR gender_matched IS NOT NULL
   OR last_name_matched IS NOT NULL
   OR provider_reference IS NOT NULL
   OR reviewed_at IS NOT NULL
   OR submitted_cin IS NOT NULL;

ALTER TABLE kyc_documents
  DROP COLUMN birth_date_matched,
  DROP COLUMN cin_matched,
  DROP COLUMN document_confidence,
  DROP COLUMN document_face_match_score,
  DROP COLUMN document_valid,
  DROP COLUMN extracted_birth_date,
  DROP COLUMN extracted_cin,
  DROP COLUMN extracted_gender,
  DROP COLUMN face_matched,
  DROP COLUMN first_name_matched,
  DROP COLUMN gender_matched,
  DROP COLUMN last_name_matched,
  DROP COLUMN provider_reference,
  DROP COLUMN reviewed_at,
  DROP COLUMN submitted_cin;

-- ---------------------------------------------------------------------------
-- Phase D: repository/script cleanup notes, not executable SQL
-- ---------------------------------------------------------------------------

-- Remove obsolete table references from:
-- - scripts/db/reset-mysql.sql
-- - scripts/db/reset-postgresql.sql
-- - creadiTn/src/main/java/.../DevDatabaseResetService.java
--
-- Obsolete table names:
-- - verification_tokens: replaced by email verification OTP columns on users
-- - credits: replaced by credit_requests
--
-- Replace or delete stale schema resources:
-- - creadiTn/src/main/resources/schema.sql
-- - creadiTn/src/main/resources/schema-bnpl.sql
-- Prefer a single current schema/migration source after Step 3/4 cleanup.
