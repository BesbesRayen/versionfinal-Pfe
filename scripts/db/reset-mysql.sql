-- CreadiTN development database reset for MySQL/MariaDB.
-- Keeps schema, relations, and required application settings. Deletes application data.
-- Run only against the development database:
--   docker compose exec -T db mysql -ucreaditn -pcreaditnpass creaditn < scripts/db/reset-mysql.sql

DELIMITER //

DROP PROCEDURE IF EXISTS reset_table_if_exists//
CREATE PROCEDURE reset_table_if_exists(IN p_table_name VARCHAR(64))
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = DATABASE()
          AND table_name = p_table_name
    ) THEN
        SET @delete_sql = CONCAT('DELETE FROM `', p_table_name, '`');
        PREPARE delete_stmt FROM @delete_sql;
        EXECUTE delete_stmt;
        DEALLOCATE PREPARE delete_stmt;
    END IF;
END//

DROP PROCEDURE IF EXISTS reset_identity_if_exists//
CREATE PROCEDURE reset_identity_if_exists(IN p_table_name VARCHAR(64))
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = DATABASE()
          AND table_name = p_table_name
    ) THEN
        SET @alter_sql = CONCAT('ALTER TABLE `', p_table_name, '` AUTO_INCREMENT = 1');
        PREPARE alter_stmt FROM @alter_sql;
        EXECUTE alter_stmt;
        DEALLOCATE PREPARE alter_stmt;
    END IF;
END//

DROP PROCEDURE IF EXISTS reset_creaditn_dev_database//
CREATE PROCEDURE reset_creaditn_dev_database()
BEGIN
    IF DATABASE() <> 'creaditn' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Refusing reset: selected database is not creaditn';
    END IF;

    START TRANSACTION;

    CALL reset_table_if_exists('admin_notifications');
    CALL reset_table_if_exists('invoices');
    CALL reset_table_if_exists('payments');
    CALL reset_table_if_exists('transactions');
    CALL reset_table_if_exists('purchase_orders');
    CALL reset_table_if_exists('installments');
    CALL reset_table_if_exists('credit_requests');
    CALL reset_table_if_exists('creadi_scores');
    CALL reset_table_if_exists('financial_profiles');
    CALL reset_table_if_exists('kyc_documents');
    CALL reset_table_if_exists('cards');
    CALL reset_table_if_exists('notifications');
    CALL reset_table_if_exists('user_wallet');
    CALL reset_table_if_exists('users');
    CALL reset_table_if_exists('articles');
    CALL reset_table_if_exists('merchants');
    CALL reset_table_if_exists('messages');

    COMMIT;

    CALL reset_identity_if_exists('admin_notifications');
    CALL reset_identity_if_exists('invoices');
    CALL reset_identity_if_exists('payments');
    CALL reset_identity_if_exists('transactions');
    CALL reset_identity_if_exists('purchase_orders');
    CALL reset_identity_if_exists('installments');
    CALL reset_identity_if_exists('credit_requests');
    CALL reset_identity_if_exists('creadi_scores');
    CALL reset_identity_if_exists('financial_profiles');
    CALL reset_identity_if_exists('kyc_documents');
    CALL reset_identity_if_exists('cards');
    CALL reset_identity_if_exists('notifications');
    CALL reset_identity_if_exists('user_wallet');
    CALL reset_identity_if_exists('users');
    CALL reset_identity_if_exists('articles');
    CALL reset_identity_if_exists('merchants');
    CALL reset_identity_if_exists('messages');
END//

DELIMITER ;

CALL reset_creaditn_dev_database();

DROP PROCEDURE IF EXISTS reset_creaditn_dev_database;
DROP PROCEDURE IF EXISTS reset_identity_if_exists;
DROP PROCEDURE IF EXISTS reset_table_if_exists;

SELECT
    (SELECT COUNT(*) FROM users) AS users,
    (SELECT COUNT(*) FROM credit_requests) AS credit_requests,
    (SELECT COUNT(*) FROM installments) AS installments,
    (SELECT COUNT(*) FROM payments) AS payments,
    (SELECT COUNT(*) FROM kyc_documents) AS kyc_documents,
    (SELECT COUNT(*) FROM notifications) AS notifications;
