-- KYC security hardening migration.
-- MySQL 8 syntax. PostgreSQL deployments should add the same nullable columns
-- with equivalent ALTER TABLE statements and update the KYC status enum/check.

ALTER TABLE kyc_documents
    MODIFY COLUMN status ENUM('NOT_SUBMITTED','PENDING','MANUAL_REVIEW','APPROVED','REJECTED') NOT NULL;

ALTER TABLE users
    MODIFY COLUMN kyc_status ENUM('NOT_SUBMITTED','PENDING','MANUAL_REVIEW','APPROVED','REJECTED') NOT NULL;

ALTER TABLE kyc_documents
    ADD COLUMN liveness_score DOUBLE NULL,
    ADD COLUMN spoof_detected BOOLEAN NULL,
    ADD COLUMN provider_confidence DOUBLE NULL,
    ADD COLUMN provider_reason VARCHAR(1000) NULL,
    ADD COLUMN fraud_signals VARCHAR(1000) NULL,
    ADD COLUMN fraud_risk_score INT NULL,
    ADD COLUMN extracted_identity_number VARCHAR(255) NULL,
    ADD COLUMN extracted_first_name VARCHAR(255) NULL,
    ADD COLUMN extracted_last_name VARCHAR(255) NULL,
    ADD COLUMN extracted_date_of_birth VARCHAR(255) NULL;

CREATE INDEX idx_kyc_extracted_identity_number ON kyc_documents (extracted_identity_number);
