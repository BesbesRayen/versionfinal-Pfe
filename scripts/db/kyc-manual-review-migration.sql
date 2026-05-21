-- Migrate legacy KYC statuses to the hybrid manual-review status model.
-- Run against the creaditn MySQL database before/with the updated Spring Boot app.

ALTER TABLE users
    MODIFY kyc_status ENUM(
        'NOT_SUBMITTED',
        'PENDING',
        'MANUAL_REVIEW',
        'APPROVED',
        'VERIFIED',
        'REJECTED',
        'PENDING_MANUAL_REVIEW',
        'PROVIDER_FAILED'
    ) NOT NULL;

ALTER TABLE kyc_documents
    MODIFY status ENUM(
        'NOT_SUBMITTED',
        'PENDING',
        'MANUAL_REVIEW',
        'APPROVED',
        'VERIFIED',
        'REJECTED',
        'PENDING_MANUAL_REVIEW',
        'PROVIDER_FAILED'
    ) NOT NULL;

UPDATE users
SET kyc_status = 'VERIFIED'
WHERE kyc_status = 'APPROVED';

UPDATE users
SET kyc_status = 'PENDING_MANUAL_REVIEW'
WHERE kyc_status = 'MANUAL_REVIEW';

UPDATE kyc_documents
SET status = 'VERIFIED'
WHERE status = 'APPROVED';

UPDATE kyc_documents
SET status = 'PENDING_MANUAL_REVIEW'
WHERE status = 'MANUAL_REVIEW';

ALTER TABLE users
    MODIFY kyc_status ENUM(
        'NOT_SUBMITTED',
        'PENDING',
        'VERIFIED',
        'REJECTED',
        'PENDING_MANUAL_REVIEW',
        'PROVIDER_FAILED'
    ) NOT NULL;

ALTER TABLE kyc_documents
    MODIFY status ENUM(
        'NOT_SUBMITTED',
        'PENDING',
        'VERIFIED',
        'REJECTED',
        'PENDING_MANUAL_REVIEW',
        'PROVIDER_FAILED'
    ) NOT NULL;
