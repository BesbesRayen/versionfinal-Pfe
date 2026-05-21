-- CreadiTN development database reset for PostgreSQL.
-- Keeps schema, relations, and required application settings. Deletes application data.
-- Run only against the development database:
--   psql "$DATABASE_URL" -f scripts/db/reset-postgresql.sql

DO $$
DECLARE
    expected_database text := 'creaditn';
    tables_to_reset text[] := ARRAY[
        'admin_notifications',
        'invoices',
        'payments',
        'transactions',
        'purchase_orders',
        'installments',
        'credit_requests',
        'creadi_scores',
        'financial_profiles',
        'kyc_documents',
        'cards',
        'notifications',
        'user_wallet',
        'users',
        'articles',
        'merchants',
        'messages'
    ];
    existing_tables text;
BEGIN
    IF current_database() <> expected_database THEN
        RAISE EXCEPTION 'Refusing reset: selected database is %, expected %', current_database(), expected_database;
    END IF;

    SELECT string_agg(format('%I', table_name), ', ')
    INTO existing_tables
    FROM information_schema.tables
    WHERE table_schema = current_schema()
      AND table_name = ANY(tables_to_reset);

    IF existing_tables IS NOT NULL THEN
        EXECUTE 'TRUNCATE TABLE ' || existing_tables || ' RESTART IDENTITY CASCADE';
    END IF;
END $$;

SELECT
    COALESCE((SELECT COUNT(*) FROM users), 0) AS users,
    COALESCE((SELECT COUNT(*) FROM credit_requests), 0) AS credit_requests,
    COALESCE((SELECT COUNT(*) FROM installments), 0) AS installments,
    COALESCE((SELECT COUNT(*) FROM payments), 0) AS payments,
    COALESCE((SELECT COUNT(*) FROM kyc_documents), 0) AS kyc_documents,
    COALESCE((SELECT COUNT(*) FROM notifications), 0) AS notifications;
