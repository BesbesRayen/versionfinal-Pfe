-- Permanently remove development/test users that polluted the admin dashboard.
-- Targeted for Deleted User, kycTester, kycRetest, and codex verifier accounts.
-- Run against the creaditn MySQL database.

CREATE TEMPORARY TABLE cleanup_user_ids (
  id BIGINT PRIMARY KEY
);

INSERT INTO cleanup_user_ids (id)
SELECT id
FROM users
WHERE account_deleted = b'1'
   OR LOWER(email) LIKE 'kyc-live-%@example.com'
   OR LOWER(email) LIKE 'kyc-retest-%@example.com'
   OR LOWER(email) LIKE 'codex-p1-%@example.com'
   OR (LOWER(first_name) = 'kyc' AND LOWER(last_name) IN ('tester', 'retest'))
   OR (LOWER(first_name) = 'codex' AND LOWER(last_name) = 'verifier');

DELETE FROM payments
WHERE user_id IN (SELECT id FROM cleanup_user_ids);

DELETE FROM invoices
WHERE user_id IN (SELECT id FROM cleanup_user_ids);

DELETE FROM installments
WHERE credit_request_id IN (
  SELECT id FROM credit_requests WHERE user_id IN (SELECT id FROM cleanup_user_ids)
);

DELETE FROM purchase_orders
WHERE user_id IN (SELECT id FROM cleanup_user_ids);

DELETE FROM credit_requests
WHERE user_id IN (SELECT id FROM cleanup_user_ids);

DELETE FROM kyc_documents
WHERE user_id IN (SELECT id FROM cleanup_user_ids);

DELETE FROM cards
WHERE user_id IN (SELECT id FROM cleanup_user_ids);

DELETE FROM notifications
WHERE user_id IN (SELECT id FROM cleanup_user_ids);

DELETE FROM creadi_scores
WHERE user_id IN (SELECT id FROM cleanup_user_ids);

DELETE FROM transactions
WHERE user_id IN (SELECT id FROM cleanup_user_ids);

DELETE FROM financial_profiles
WHERE user_id IN (SELECT id FROM cleanup_user_ids);

DELETE FROM user_wallet
WHERE user_id IN (SELECT id FROM cleanup_user_ids);

DELETE FROM users
WHERE id IN (SELECT id FROM cleanup_user_ids);

DROP TEMPORARY TABLE cleanup_user_ids;
