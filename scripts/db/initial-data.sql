-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1:3307
-- Généré le : mer. 20 mai 2026 à 14:56
-- Version du serveur : 8.0.46
-- Version de PHP : 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `creaditn`
--

-- --------------------------------------------------------

--
-- Structure de la table `admin_notifications`
--

CREATE TABLE `admin_notifications` (
  `id` bigint NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `message` varchar(2500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `order_id` bigint DEFAULT NULL,
  `is_read` bit(1) NOT NULL,
  `title` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `transaction_id` varchar(70) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` enum('INVOICE_GENERATED','NEW_CREDIT_PURCHASE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `admin_notifications`
--

INSERT INTO `admin_notifications` (`id`, `created_at`, `message`, `order_id`, `is_read`, `title`, `transaction_id`, `type`, `updated_at`) VALUES
(1, '2026-05-19 16:36:52.694719', 'Client Codex Verifier purchased Ashwagandha KSM-66 on credit. Transaction: ORD-C18564D3-3, installments: 3.', 1, b'0', 'New credit purchase', 'ORD-C18564D3-3', 'NEW_CREDIT_PURCHASE', '2026-05-19 16:36:52.694736'),
(2, '2026-05-19 16:36:52.697441', 'Invoice FAC-20260519-1ACDB8 generated for transaction ORD-C18564D3-3', 1, b'0', 'Invoice generated', 'ORD-C18564D3-3', 'INVOICE_GENERATED', '2026-05-19 16:36:52.697457'),
(3, '2026-05-20 00:01:00.375085', 'Client Rayen Hhe purchased Multivitamines on credit. Transaction: ORD-4F06AC41-7, installments: 3.', 2, b'0', 'New credit purchase', 'ORD-4F06AC41-7', 'NEW_CREDIT_PURCHASE', '2026-05-20 00:01:00.375100'),
(4, '2026-05-20 00:01:00.379667', 'Invoice FAC-20260520-5A8205 generated for transaction ORD-4F06AC41-7', 2, b'0', 'Invoice generated', 'ORD-4F06AC41-7', 'INVOICE_GENERATED', '2026-05-20 00:01:00.379703'),
(5, '2026-05-20 00:24:35.947363', 'Client Hama Hama purchased Ashwagandha KSM-66 on credit. Transaction: ORD-5051A0BA-B, installments: 9.', 3, b'0', 'New credit purchase', 'ORD-5051A0BA-B', 'NEW_CREDIT_PURCHASE', '2026-05-20 00:24:35.947399'),
(6, '2026-05-20 00:24:35.951516', 'Invoice FAC-20260520-03F4A4 generated for transaction ORD-5051A0BA-B', 3, b'0', 'Invoice generated', 'ORD-5051A0BA-B', 'INVOICE_GENERATED', '2026-05-20 00:24:35.951583');

-- --------------------------------------------------------

--
-- Structure de la table `articles`
--

CREATE TABLE `articles` (
  `id` bigint NOT NULL,
  `active` bit(1) NOT NULL,
  `boutique_name` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `description` varchar(2000) COLLATE utf8mb4_unicode_ci NOT NULL,
  `image_url` varchar(600) COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` decimal(12,2) NOT NULL,
  `product_name` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `source_url` varchar(800) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `articles`
--

INSERT INTO `articles` (`id`, `active`, `boutique_name`, `category`, `created_at`, `description`, `image_url`, `price`, `product_name`, `updated_at`, `source_url`) VALUES
(1, b'1', 'chaise', 'product', '2026-05-19 11:54:10.984037', 'Chaise&#x20;Plastique&#x20;Afrah&#x20;-&#x20;Avec&#x20;4&#x20;Pieds&#x20;-&#x20;Rev&#xEA;tement&#x20;anti-d&#xE9;rapant&#x20;-&#x20;Chaise&#x20;empilable,&#x20;l&#xE9;g&#xE8;re&#x20;et&#x20;facile&#x20;&#xE0;&#x20;ranger&#x20;-&#x20;Con&#xE7;ues&#x20;pour&#x20;un&#x20;usage&#x20;int&#xE9;rieur&#x20;et&#x20;ext&#xE9;rieur&#x20;-&#x20;Id&#xE9;ale&#x20;pour&#x20;le&#x20;jardin,&#x20;maison&#x20;et&#x20;plage&#x20;-&#x20;Couleur&#x3A;&#x20;Blanc&#x0D;&#x0A;&#x0D;&#x0A;Livraison&#x20;Gratuite&#x20;&#xE0;&#x20;partir&#x20;de&#x20;300DT&#x20;d&#x27;Achat&#x0D;&#x0A;', 'https://mk-media.mytek.tn/media/catalog/product/cache/7683d28f7d5b38a73a8ad2bb0d1aa983/c/h/chaise-plastique-afrah-blanc.jpg', 9.90, 'Chaise', '2026-05-19 11:54:10.984055', 'https://www.mytek.tn/chaise-plastique-afrah-blanc.html'),
(2, b'1', 'BioHerbs', 'product', '2026-05-19 11:54:38.592454', '✅ Ashwagandha KSM-66® Bioherbs authentique et officiel Vous pouvez Vérifier l’authenticité de notre produit directement sur le site officiel KSM-66® via ce lien : 👉 Ashwagandha KSM-66® Bioherbs 🌿 Ashwagandha KSM-66® Bioherbs – Équilibre, Énergie &amp; Bien-être Stress • Sommeil • Énergie • Concentration • Vitalité L’Ashwagandha KSM-66® Bioherbs en...', 'https://www.bioherbs.tn/cdn/shop/files/ksm66ashwagandha-new-529414-555813.jpg?v=1729334689', 49.00, 'Ashwagandha KSM-66', '2026-05-19 11:54:38.592473', 'https://www.bioherbs.tn/collections/nos-produits/products/ashwagandha-ksm-66'),
(3, b'1', 'BioHerbs', 'product', '2026-05-19 11:54:55.413113', '🧬 Multivitamines Bioherbs – Énergie, Immunité &amp; Vitalité Vitamines • Minéraux • Fatigue • Énergie • Bien-être Les Multivitamines Bioherbs en Tunisie apportent un complexe complet de vitamines et minéraux essentiels pour accompagner les besoins quotidiens de l’organisme. Cette formule contribue à compléter les apports nutritionnels et aide à soutenir...', 'https://www.bioherbs.tn/cdn/shop/products/multivitamins-boite-404902.jpg?v=1678571556', 39.00, 'Multivitamines', '2026-05-19 11:54:55.413197', 'https://www.bioherbs.tn/collections/nos-produits/products/multivitamines');

-- --------------------------------------------------------

--
-- Structure de la table `cards`
--

CREATE TABLE `cards` (
  `id` bigint NOT NULL,
  `card_number` varchar(1024) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cardholder_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `expiry_date` varchar(5) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_default` bit(1) NOT NULL,
  `last4` varchar(4) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('ACTIVE','BLOCKED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('MASTERCARD','VISA') COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `user_id` bigint NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `cards`
--

INSERT INTO `cards` (`id`, `card_number`, `cardholder_name`, `created_at`, `expiry_date`, `is_default`, `last4`, `status`, `type`, `updated_at`, `user_id`) VALUES
(2, 'BWi6v+ZmB/L6e3YGLLP1JX4VRzrFloWxGpvFROapO+ZABZpdis6c7yPJo/A=', 'Rayen', '2026-05-19 23:57:17.709374', '01/26', b'1', '8848', 'ACTIVE', 'VISA', '2026-05-19 23:57:17.709414', 7);

-- --------------------------------------------------------

--
-- Structure de la table `creadi_scores`
--

CREATE TABLE `creadi_scores` (
  `id` bigint NOT NULL,
  `badge` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `behavior_score` int DEFAULT NULL,
  `children_score` int DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `kyc_score` int DEFAULT NULL,
  `level` enum('EXCELLENT','GOOD','HIGH_RISK','MEDIUM') COLLATE utf8mb4_unicode_ci NOT NULL,
  `marital_score` int DEFAULT NULL,
  `reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `risk` enum('CRITICAL','HIGH','LOW','MODERATE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `salary_score` int DEFAULT NULL,
  `total_score` int DEFAULT NULL,
  `user_id` bigint NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `creadi_scores`
--

INSERT INTO `creadi_scores` (`id`, `badge`, `behavior_score`, `children_score`, `created_at`, `kyc_score`, `level`, `marital_score`, `reason`, `risk`, `salary_score`, `total_score`, `user_id`) VALUES
(20, NULL, 100, 50, '2026-05-19 22:50:40.778939', 0, 'HIGH_RISK', 50, 'Your score is at high risk level due to clean fraud record. Consider improving: identity not yet verified, no salary information provided.', 'CRITICAL', 0, 200, 7),
(22, NULL, 100, 50, '2026-05-19 22:53:45.572997', 0, 'HIGH_RISK', 50, 'Your score is at high risk level due to clean fraud record. Consider improving: identity not yet verified, no salary information provided.', 'CRITICAL', 0, 200, 7),
(24, NULL, 100, 50, '2026-05-19 23:07:53.711870', 0, 'HIGH_RISK', 50, 'Your score is at high risk level due to clean fraud record. Consider improving: identity not yet verified, no salary information provided.', 'CRITICAL', 0, 200, 7),
(27, 'BRONZE', 200, 100, '2026-05-19 23:56:10.600485', 300, 'GOOD', 50, 'Your score is good due to verified identity, clean fraud record. Consider improving: no salary information provided.', 'MODERATE', 0, 650, 7),
(28, 'SILVER', 200, 100, '2026-05-19 23:57:31.998560', 300, 'EXCELLENT', 50, 'Your score is excellent due to verified identity, stable salary, clean fraud record.', 'LOW', 200, 850, 7),
(29, 'SILVER', 200, 100, '2026-05-19 23:58:09.497795', 300, 'EXCELLENT', 50, 'Your score is excellent due to verified identity, stable salary, clean fraud record.', 'LOW', 200, 850, 7),
(30, 'SILVER', 200, 100, '2026-05-20 00:02:00.730981', 300, 'EXCELLENT', 50, 'Your score is excellent due to verified identity, stable salary, clean fraud record.', 'LOW', 200, 850, 7),
(37, NULL, 100, 50, '2026-05-20 11:52:49.732898', 0, 'HIGH_RISK', 50, 'Your score is at high risk level due to clean fraud record. Consider improving: identity not yet verified, no salary information provided.', 'CRITICAL', 0, 200, 11),
(39, 'SILVER', 200, 100, '2026-05-20 12:35:05.491169', 300, 'EXCELLENT', 50, 'Your score is excellent due to verified identity, stable salary, clean fraud record.', 'LOW', 200, 850, 7),
(40, 'SILVER', 200, 100, '2026-05-20 12:35:56.684181', 300, 'EXCELLENT', 50, 'Your score is excellent due to verified identity, stable salary, clean fraud record.', 'LOW', 200, 850, 7);

-- --------------------------------------------------------

--
-- Structure de la table `credit_requests`
--

CREATE TABLE `credit_requests` (
  `id` bigint NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `down_payment` decimal(38,2) NOT NULL,
  `monthly_amount` decimal(38,2) NOT NULL,
  `number_of_installments` int NOT NULL,
  `product_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('APPROVED','PENDING','REJECTED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_amount` decimal(38,2) NOT NULL,
  `user_id` bigint NOT NULL,
  `financed_amount` decimal(12,2) NOT NULL,
  `interest_amount` decimal(12,2) NOT NULL,
  `interest_rate` decimal(8,4) NOT NULL,
  `total_payable` decimal(12,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `credit_requests`
--

INSERT INTO `credit_requests` (`id`, `created_at`, `down_payment`, `monthly_amount`, `number_of_installments`, `product_name`, `status`, `total_amount`, `user_id`, `financed_amount`, `interest_amount`, `interest_rate`, `total_payable`) VALUES
(2, '2026-05-20 00:00:57.328822', 7.80, 10.40, 3, 'Multivitamines', 'APPROVED', 39.00, 7, 31.20, 0.00, 0.0000, 31.20);

-- --------------------------------------------------------

--
-- Structure de la table `financial_profiles`
--

CREATE TABLE `financial_profiles` (
  `id` bigint NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `employment_status` enum('FULL_TIME','OTHER','PART_TIME','SELF_EMPLOYED','STUDENT','UNEMPLOYED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `monthly_salary` decimal(12,2) NOT NULL,
  `risk_level` enum('CRITICAL','HIGH','LOW','MODERATE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `salary_day` int NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `user_id` bigint NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `financial_profiles`
--

INSERT INTO `financial_profiles` (`id`, `created_at`, `employment_status`, `monthly_salary`, `risk_level`, `salary_day`, `updated_at`, `user_id`) VALUES
(2, '2026-05-19 23:57:31.971250', 'PART_TIME', 1500.00, 'MODERATE', 1, '2026-05-19 23:57:31.971275', 7);

-- --------------------------------------------------------

--
-- Structure de la table `installments`
--

CREATE TABLE `installments` (
  `id` bigint NOT NULL,
  `amount` decimal(38,2) NOT NULL,
  `due_date` date NOT NULL,
  `paid_date` datetime(6) DEFAULT NULL,
  `penalty` decimal(38,2) DEFAULT NULL,
  `status` enum('OVERDUE','PAID','PENDING') COLLATE utf8mb4_unicode_ci NOT NULL,
  `credit_request_id` bigint NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `installments`
--

INSERT INTO `installments` (`id`, `amount`, `due_date`, `paid_date`, `penalty`, `status`, `credit_request_id`) VALUES
(4, 10.40, '2026-06-03', '2026-05-20 00:02:00.704886', 0.00, 'PAID', 2),
(5, 10.40, '2026-07-03', '2026-05-20 12:35:05.468452', 0.00, 'PAID', 2),
(6, 10.40, '2026-08-03', '2026-05-20 12:35:56.662523', 0.00, 'PAID', 2);

-- --------------------------------------------------------

--
-- Structure de la table `invoices`
--

CREATE TABLE `invoices` (
  `id` bigint NOT NULL,
  `article_name` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `boutique_name` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `client_email` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `client_name` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `client_phone` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `invoice_number` varchar(70) COLLATE utf8mb4_unicode_ci NOT NULL,
  `number_of_installments` int NOT NULL,
  `payment_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `purchase_date` datetime(6) NOT NULL,
  `statement` varchar(800) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('ISSUED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_price` decimal(12,2) NOT NULL,
  `transaction_id` varchar(70) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `order_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `financed_amount` decimal(12,2) NOT NULL,
  `interest_rate` decimal(8,4) NOT NULL,
  `merchant_margin_rate` decimal(8,4) NOT NULL,
  `merchant_payout_amount` decimal(12,2) NOT NULL,
  `platform_profit_amount` decimal(12,2) NOT NULL,
  `total_payable` decimal(12,2) NOT NULL,
  `interest_amount` decimal(12,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `invoices`
--

INSERT INTO `invoices` (`id`, `article_name`, `boutique_name`, `client_email`, `client_name`, `client_phone`, `created_at`, `invoice_number`, `number_of_installments`, `payment_type`, `purchase_date`, `statement`, `status`, `total_price`, `transaction_id`, `updated_at`, `order_id`, `user_id`, `financed_amount`, `interest_rate`, `merchant_margin_rate`, `merchant_payout_amount`, `platform_profit_amount`, `total_payable`, `interest_amount`) VALUES
(2, 'Multivitamines', 'BioHerbs', 'rayenbesbes9@gmail.com', 'Rayen Hhe', '20409390', '2026-05-20 00:01:00.370417', 'FAC-20260520-5A8205', 3, 'CREDIT', '2026-05-20 00:01:00.350759', 'The application paid the boutique; the client must reimburse the application.', 'ISSUED', 39.00, 'ORD-4F06AC41-7', '2026-05-20 00:01:00.370442', 2, 7, 31.20, 0.0000, 0.0000, 39.00, 0.00, 31.20, 0.00);

-- --------------------------------------------------------

--
-- Structure de la table `kyc_audit_logs`
--

CREATE TABLE `kyc_audit_logs` (
  `id` bigint NOT NULL,
  `admin_id` varchar(255) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `decision` enum('NOT_SUBMITTED','PENDING','PENDING_MANUAL_REVIEW','PROVIDER_FAILED','REJECTED','VERIFIED') NOT NULL,
  `previous_status` enum('NOT_SUBMITTED','PENDING','PENDING_MANUAL_REVIEW','PROVIDER_FAILED','REJECTED','VERIFIED') NOT NULL,
  `reason` varchar(1000) DEFAULT NULL,
  `kyc_document_id` bigint NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `kyc_audit_logs`
--

INSERT INTO `kyc_audit_logs` (`id`, `admin_id`, `created_at`, `decision`, `previous_status`, `reason`, `kyc_document_id`) VALUES
(1, 'admin', '2026-05-19 23:56:10.537336', 'VERIFIED', 'PENDING_MANUAL_REVIEW', 'Manual review approved by admin', 15),
(2, 'admin', '2026-05-20 00:13:20.251181', 'VERIFIED', 'PENDING_MANUAL_REVIEW', 'Manual review approved by admin', 16);

-- --------------------------------------------------------

--
-- Structure de la table `kyc_documents`
--

CREATE TABLE `kyc_documents` (
  `id` bigint NOT NULL,
  `admin_comment` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cin_back_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cin_front_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cin_number` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `face_match_score` double DEFAULT NULL,
  `ocr_result` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `selfie_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('NOT_SUBMITTED','PENDING','VERIFIED','REJECTED','PENDING_MANUAL_REVIEW','PROVIDER_FAILED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint NOT NULL,
  `cin_back_hash` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cin_front_hash` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cin_number_unique` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `didit_identity_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `extracted_identity_number` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `birth_date_matched` bit(1) DEFAULT NULL,
  `cin_matched` bit(1) DEFAULT NULL,
  `document_confidence` int DEFAULT NULL,
  `document_face_match_score` int DEFAULT NULL,
  `document_valid` bit(1) DEFAULT NULL,
  `extracted_birth_date` date DEFAULT NULL,
  `extracted_cin` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `extracted_first_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `extracted_gender` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `extracted_last_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `face_matched` bit(1) DEFAULT NULL,
  `first_name_matched` bit(1) DEFAULT NULL,
  `gender_matched` bit(1) DEFAULT NULL,
  `last_name_matched` bit(1) DEFAULT NULL,
  `liveness_passed` bit(1) DEFAULT NULL,
  `provider_reference` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reviewed_at` datetime(6) DEFAULT NULL,
  `submitted_cin` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `extracted_date_of_birth` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fraud_risk_score` int DEFAULT NULL,
  `fraud_signals` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `liveness_score` double DEFAULT NULL,
  `provider_confidence` double DEFAULT NULL,
  `provider_reason` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `spoof_detected` bit(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `kyc_documents`
--

INSERT INTO `kyc_documents` (`id`, `admin_comment`, `cin_back_url`, `cin_front_url`, `cin_number`, `created_at`, `face_match_score`, `ocr_result`, `selfie_url`, `status`, `user_id`, `cin_back_hash`, `cin_front_hash`, `cin_number_unique`, `didit_identity_id`, `extracted_identity_number`, `birth_date_matched`, `cin_matched`, `document_confidence`, `document_face_match_score`, `document_valid`, `extracted_birth_date`, `extracted_cin`, `extracted_first_name`, `extracted_gender`, `extracted_last_name`, `face_matched`, `first_name_matched`, `gender_matched`, `last_name_matched`, `liveness_passed`, `provider_reference`, `reviewed_at`, `submitted_cin`, `extracted_date_of_birth`, `fraud_risk_score`, `fraud_signals`, `liveness_score`, `provider_confidence`, `provider_reason`, `spoof_detected`) VALUES
(15, 'Manual review approved by admin', '/api/files/kyc/7/cin_back.jpg', '/api/files/kyc/7/cin_front.jpg', NULL, '2026-05-19 23:07:51.959732', NULL, NULL, '/api/files/kyc/7/selfie.jpg', 'VERIFIED', 7, '87cbf3802f532d27eeb5cb112d17c41c7f4d686f167884600c009cfdaf35b8ae', '94bb1fd1c13536ceec1f08a941006f42116e995e2c3e13aca23951a904bd3536', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 60, 'failedAttempts=0;repeatedIdentity=false;rapidRetry=placeholder;deviceMismatch=placeholder;vpnProxy=placeholder', NULL, NULL, 'Didit API unavailable or rejected the request: 403 Forbidden on POST request for \"https://verification.didit.me/v3/id-verification/\": \"{\"error\":\"You don\'t have enough credits to perform this request. Please top up at https://business.didit.me\"}\"', NULL),
(16, 'Manual review approved by admin', '/api/files/kyc/9/cin_back.jpg', '/api/files/kyc/9/cin_front.jpg', NULL, '2026-05-19 23:12:26.513176', NULL, NULL, '/api/files/kyc/9/selfie.jpg', 'VERIFIED', 9, 'a9128a1d550b48876e9c1fd7ad49425aa03a67aa39da10b22583f0a67667f5fe', 'a164f5700a4ff6662dbfe304a58db257acf6058749e72d48b299c5cf583de11d', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 60, 'failedAttempts=0;repeatedIdentity=false;rapidRetry=placeholder;deviceMismatch=placeholder;vpnProxy=placeholder', NULL, NULL, 'Didit API unavailable or rejected the request: 403 Forbidden on POST request for \"https://verification.didit.me/v3/id-verification/\": \"{\"error\":\"You don\'t have enough credits to perform this request. Please top up at https://business.didit.me\"}\"', NULL),
(20, 'KYC provider unavailable. Manual review required.', '/api/files/kyc/11/cin_back.jpg', '/api/files/kyc/11/cin_front.jpg', NULL, '2026-05-20 12:44:40.421869', NULL, NULL, '/api/files/kyc/11/selfie.jpg', 'PENDING_MANUAL_REVIEW', 11, '35e061c2f6a8cf67632ee2dc479e8c78ecb9e9ec20fe8c59bf0cc10d45b86f1f', '141693df2a8f46ec55c6faace83eec3cce50313f7b3a157d9b9fc2da99b3c0d0', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 60, 'failedAttempts=0;repeatedIdentity=false;rapidRetry=placeholder;deviceMismatch=placeholder;vpnProxy=placeholder', NULL, NULL, 'Didit API unavailable or rejected the request: 403 Forbidden on POST request for \"https://verification.didit.me/v3/id-verification/\": \"{\"error\":\"You don\'t have enough credits to perform this request. Please top up at https://business.didit.me\"}\"', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `merchants`
--

CREATE TABLE `merchants` (
  `id` bigint NOT NULL,
  `active` bit(1) NOT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `logo_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `messages`
--

CREATE TABLE `messages` (
  `id` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `subject` varchar(500) COLLATE utf8mb4_general_ci NOT NULL,
  `message` text COLLATE utf8mb4_general_ci NOT NULL,
  `status` enum('new','unread','read','replied') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'unread',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `notifications`
--

CREATE TABLE `notifications` (
  `id` bigint NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `message` text COLLATE utf8mb4_unicode_ci,
  `is_read` bit(1) NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('CREDIT_APPROVED','CREDIT_REJECTED','INSTALLMENT_OVERDUE','KYC_VALIDATED','PAYMENT_CONFIRMED','PAYMENT_REMINDER') COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `notifications`
--

INSERT INTO `notifications` (`id`, `created_at`, `message`, `is_read`, `title`, `type`, `user_id`) VALUES
(20, '2026-05-19 23:07:53.722564', 'Your identity verification needs manual review. Reason: KYC provider unavailable. Manual review required.', b'0', 'KYC Manual Review', 'KYC_VALIDATED', 7),
(22, '2026-05-19 23:56:10.629525', 'Your identity has been verified successfully.', b'0', 'KYC verified', 'KYC_VALIDATED', 7),
(23, '2026-05-19 23:57:17.727625', 'Your card **** **** **** 8848 has been linked successfully.', b'0', 'Payment method added', 'PAYMENT_CONFIRMED', 7),
(24, '2026-05-19 23:57:32.008099', 'Your salary profile is now complete. You can request credit.', b'0', 'Financial profile updated', 'CREDIT_APPROVED', 7),
(25, '2026-05-20 00:00:57.360334', 'Your credit request of 39.00 DT has been approved.', b'0', 'Credit Approved', 'CREDIT_APPROVED', 7),
(26, '2026-05-20 00:01:00.384195', 'Your order for Multivitamines is active on 3 installments.', b'0', 'Credit purchase confirmed', 'CREDIT_APPROVED', 7),
(27, '2026-05-20 00:02:00.740104', 'Payment of 10.4 DT confirmed. Ref: TXN-0E76B011', b'0', 'Payment Confirmed', 'PAYMENT_CONFIRMED', 7),
(38, '2026-05-20 12:35:05.496711', 'Auto-payment of 10.40 TND processed for installment due 2026-07-03. Ref: AUTO-65805703', b'0', 'Autopay Successful', 'PAYMENT_CONFIRMED', 7),
(39, '2026-05-20 12:35:56.691000', 'Auto-payment of 10.40 TND processed for installment due 2026-08-03. Ref: AUTO-41C2E229', b'0', 'Autopay Successful', 'PAYMENT_CONFIRMED', 7),
(40, '2026-05-20 12:42:54.727373', 'Your identity verification needs manual review. Reason: KYC provider unavailable. Manual review required.', b'0', 'KYC Manual Review', 'KYC_VALIDATED', 11),
(41, '2026-05-20 12:43:58.773400', 'Your identity verification needs manual review. Reason: KYC provider unavailable. Manual review required.', b'0', 'KYC Manual Review', 'KYC_VALIDATED', 11),
(42, '2026-05-20 12:44:41.654017', 'Your identity verification needs manual review. Reason: KYC provider unavailable. Manual review required.', b'0', 'KYC Manual Review', 'KYC_VALIDATED', 11);

-- --------------------------------------------------------

--
-- Structure de la table `payments`
--

CREATE TABLE `payments` (
  `id` bigint NOT NULL,
  `amount` decimal(38,2) NOT NULL,
  `paid_at` datetime(6) DEFAULT NULL,
  `payment_method` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `transaction_reference` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `installment_id` bigint NOT NULL,
  `user_id` bigint NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `payments`
--

INSERT INTO `payments` (`id`, `amount`, `paid_at`, `payment_method`, `transaction_reference`, `installment_id`, `user_id`) VALUES
(2, 10.40, '2026-05-20 00:02:00.692687', 'CARD', 'TXN-0E76B011', 4, 7),
(12, 10.40, '2026-05-20 12:35:05.469623', 'AUTO_CARD', 'AUTO-65805703', 5, 7),
(13, 10.40, '2026-05-20 12:35:56.663523', 'AUTO_CARD', 'AUTO-41C2E229', 6, 7);

-- --------------------------------------------------------

--
-- Structure de la table `purchase_orders`
--

CREATE TABLE `purchase_orders` (
  `id` bigint NOT NULL,
  `article_name` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `boutique_name` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `down_payment` decimal(12,2) NOT NULL,
  `financed_amount` decimal(12,2) NOT NULL,
  `installment_months` int DEFAULT NULL,
  `merchant_paid` bit(1) NOT NULL,
  `merchant_paid_at` datetime(6) DEFAULT NULL,
  `merchant_payout_reference` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `monthly_amount` decimal(12,2) DEFAULT NULL,
  `payment_type` enum('CASH','CREDIT') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('COMPLETED','CREDIT_ACTIVE','CREDIT_REJECTED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_price` decimal(12,2) NOT NULL,
  `transaction_id` varchar(70) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `article_id` bigint NOT NULL,
  `credit_request_id` bigint DEFAULT NULL,
  `user_id` bigint NOT NULL,
  `interest_amount` decimal(12,2) NOT NULL,
  `interest_rate` decimal(8,4) NOT NULL,
  `merchant_margin_rate` decimal(8,4) NOT NULL,
  `merchant_payout_amount` decimal(12,2) NOT NULL,
  `platform_profit_amount` decimal(12,2) NOT NULL,
  `total_payable` decimal(12,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `purchase_orders`
--

INSERT INTO `purchase_orders` (`id`, `article_name`, `boutique_name`, `category`, `created_at`, `down_payment`, `financed_amount`, `installment_months`, `merchant_paid`, `merchant_paid_at`, `merchant_payout_reference`, `monthly_amount`, `payment_type`, `status`, `total_price`, `transaction_id`, `updated_at`, `article_id`, `credit_request_id`, `user_id`, `interest_amount`, `interest_rate`, `merchant_margin_rate`, `merchant_payout_amount`, `platform_profit_amount`, `total_payable`) VALUES
(2, 'Multivitamines', 'BioHerbs', 'product', '2026-05-20 00:01:00.350759', 7.80, 31.20, 3, b'1', '2026-05-20 00:01:00.350049', 'MRCH-B6CB2856', 10.40, 'CREDIT', 'CREDIT_ACTIVE', 39.00, 'ORD-4F06AC41-7', '2026-05-20 00:01:00.350774', 3, 2, 7, 0.00, 0.0000, 0.0000, 39.00, 0.00, 31.20);

-- --------------------------------------------------------

--
-- Structure de la table `transactions`
--

CREATE TABLE `transactions` (
  `id` bigint NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `transactions`
--

INSERT INTO `transactions` (`id`, `amount`, `created_at`, `description`, `reference`, `status`, `type`, `user_id`) VALUES
(3, 31.20, '2026-05-20 00:01:00.356567', 'App paid boutique for article Multivitamines; client reimburses monthly', 'ORD-4F06AC41-7', 'SUCCESS', 'CREDIT_PURCHASE', 7),
(4, 10.40, '2026-05-20 00:02:00.705874', 'Installment payment', 'TXN-0E76B011', 'SUCCESS', 'PAYMENT', 7),
(7, 10.40, '2026-05-20 12:35:05.472524', 'Autopay - installment due 2026-07-03', 'AUTO-65805703', 'SUCCESS', 'PAYMENT', 7),
(8, 10.40, '2026-05-20 12:35:56.672574', 'Autopay - installment due 2026-08-03', 'AUTO-41C2E229', 'SUCCESS', 'PAYMENT', 7);

-- --------------------------------------------------------

--
-- Structure de la table `users`
--

CREATE TABLE `users` (
  `id` bigint NOT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `autopay` bit(1) NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `kyc_failed_attempts` int DEFAULT NULL,
  `kyc_fraud_flag` bit(1) NOT NULL,
  `kyc_provider` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `kyc_status` enum('NOT_SUBMITTED','PENDING','VERIFIED','REJECTED','PENDING_MANUAL_REVIEW','PROVIDER_FAILED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `kyc_submitted_at` datetime(6) DEFAULT NULL,
  `last_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `marital_status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `monthly_salary` double DEFAULT NULL,
  `number_of_children` int DEFAULT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payment_score_modifier` int DEFAULT NULL,
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `profession` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `profile_photo_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `account_deleted` bit(1) NOT NULL,
  `email_verification_attempts` int DEFAULT NULL,
  `email_verification_otp` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email_verification_otp_expiry` datetime(6) DEFAULT NULL,
  `email_verification_sent_at` datetime(6) DEFAULT NULL,
  `email_verified` bit(1) NOT NULL,
  `email_verified_at` datetime(6) DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  `gender` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `kyc_verified` bit(1) DEFAULT NULL,
  `kyc_verified_at` datetime(6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `users`
--

INSERT INTO `users` (`id`, `address`, `autopay`, `created_at`, `email`, `first_name`, `kyc_failed_attempts`, `kyc_fraud_flag`, `kyc_provider`, `kyc_status`, `kyc_submitted_at`, `last_name`, `marital_status`, `monthly_salary`, `number_of_children`, `password_hash`, `payment_score_modifier`, `phone`, `profession`, `profile_photo_url`, `updated_at`, `account_deleted`, `email_verification_attempts`, `email_verification_otp`, `email_verification_otp_expiry`, `email_verification_sent_at`, `email_verified`, `email_verified_at`, `birth_date`, `gender`, `kyc_verified`, `kyc_verified_at`) VALUES
(7, 'Hdjs', b'0', '2026-05-19 22:50:40.775232', 'rayenbesbes9@gmail.com', 'Rayen', 0, b'0', 'DIDIT', 'VERIFIED', '2026-05-19 23:56:10.595409', 'Hhe', NULL, 1500, 0, '$2a$10$8A1CaB3DKZ7uvsyr3khwXuRgp3S9mPN4LrRgc0Kj11INx1dESy5Ne', 30, '20409390', NULL, NULL, '2026-05-20 12:36:10.796615', b'0', 0, NULL, NULL, '2026-05-19 22:50:40.782629', b'1', '2026-05-19 22:51:02.529000', NULL, NULL, NULL, NULL),
(9, NULL, b'1', '2026-05-19 23:10:57.868159', 'deleted_9_1779277908922@deleted.invalid', 'Deleted', 0, b'0', 'DIDIT', 'VERIFIED', '2026-05-20 00:13:20.263013', 'User', NULL, 3000, 0, '$2a$10$wDdaAXLY0uOoNVBSyvtKceUzbJlh6gjte9XzkJFd3IVLTiDcQLvV2', 10, NULL, NULL, NULL, '2026-05-20 11:51:48.982032', b'1', 0, NULL, NULL, '2026-05-19 23:10:57.888158', b'1', '2026-05-19 23:11:14.842434', NULL, NULL, NULL, NULL),
(11, 'Bjj', b'0', '2026-05-20 11:52:49.726259', 'vdirassacoding@gmail.com', 'Raslen', 0, b'0', 'DIDIT', 'PENDING_MANUAL_REVIEW', '2026-05-20 12:44:43.680974', 'Hh', NULL, NULL, 0, '$2a$10$eG6aO0et2wyasfXNPUG8zOdyVDcXEA7wS7osP4LoQJkZzHCMkLk0y', 0, '20409390', NULL, NULL, '2026-05-20 12:44:43.681374', b'0', 0, NULL, NULL, '2026-05-20 12:41:17.325255', b'1', '2026-05-20 12:41:39.101959', NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `user_wallet`
--

CREATE TABLE `user_wallet` (
  `id` bigint NOT NULL,
  `balance` decimal(10,2) NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `user_id` bigint NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `user_wallet`
--

INSERT INTO `user_wallet` (`id`, `balance`, `created_at`, `updated_at`, `user_id`) VALUES
(7, 1968.80, '2026-05-19 22:50:40.777589', '2026-05-20 12:35:56.675216', 7),
(11, 2000.00, '2026-05-20 11:52:49.730539', '2026-05-20 11:52:49.730556', 11);

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `admin_notifications`
--
ALTER TABLE `admin_notifications`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `articles`
--
ALTER TABLE `articles`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `cards`
--
ALTER TABLE `cards`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FKcmanafgwbibfijy2o5isfk3d5` (`user_id`);

--
-- Index pour la table `creadi_scores`
--
ALTER TABLE `creadi_scores`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK5ksgepgsgxt26v5vky2ie49qs` (`user_id`);

--
-- Index pour la table `credit_requests`
--
ALTER TABLE `credit_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FKqqaj53cdd5yui6nr9faqxro7r` (`user_id`);

--
-- Index pour la table `financial_profiles`
--
ALTER TABLE `financial_profiles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UK4jrh39uvndm2javq34lb1jexu` (`user_id`);

--
-- Index pour la table `installments`
--
ALTER TABLE `installments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK7k1jkwkhmkrcepft7pu7cnq00` (`credit_request_id`);

--
-- Index pour la table `invoices`
--
ALTER TABLE `invoices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UKl1x55mfsay7co0r3m9ynvipd5` (`invoice_number`),
  ADD UNIQUE KEY `UKjes3ujnqxrugth3qctcmskwml` (`transaction_id`),
  ADD UNIQUE KEY `UKe718q5klx5pempy28p2nx88a6` (`order_id`),
  ADD KEY `FKbwr4d4vyqf2bkoetxtt8j9dx7` (`user_id`);

--
-- Index pour la table `kyc_audit_logs`
--
ALTER TABLE `kyc_audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FKg4tv6b0qv2jgeck0q2hjjv32u` (`kyc_document_id`);

--
-- Index pour la table `kyc_documents`
--
ALTER TABLE `kyc_documents`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_kyc_cin_number` (`cin_number_unique`),
  ADD UNIQUE KEY `uq_kyc_front_hash` (`cin_front_hash`),
  ADD UNIQUE KEY `uq_kyc_back_hash` (`cin_back_hash`),
  ADD UNIQUE KEY `uq_kyc_didit_id` (`didit_identity_id`),
  ADD KEY `FKllb8bcbbyo994afdepf7f7j63` (`user_id`);

--
-- Index pour la table `merchants`
--
ALTER TABLE `merchants`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK9y21adhxn0ayjhfocscqox7bh` (`user_id`);

--
-- Index pour la table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UKrwn36natqiwaseu5c3jvaun3` (`transaction_reference`),
  ADD KEY `FKp0wyj2pahks5oh3qs9qstfnsj` (`installment_id`),
  ADD KEY `FKj94hgy9v5fw1munb90tar2eje` (`user_id`);

--
-- Index pour la table `purchase_orders`
--
ALTER TABLE `purchase_orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UKj9nh8v228i4ruhyupy67ra6py` (`transaction_id`),
  ADD KEY `FKfvk9w884rbmso2tiv89e232tx` (`article_id`),
  ADD KEY `FK5dsyovo7wihbep1fluuar8kes` (`credit_request_id`),
  ADD KEY `FKquq1njrq27p9ye5u19f1yvnfp` (`user_id`);

--
-- Index pour la table `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UKj6ef2k4uhj4iy1wl38fry8ih5` (`reference`);

--
-- Index pour la table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UK6dotkott2kjsp8vw4d0m25fb7` (`email`);

--
-- Index pour la table `user_wallet`
--
ALTER TABLE `user_wallet`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UKsmlynan5580w2445atlq9aaom` (`user_id`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `admin_notifications`
--
ALTER TABLE `admin_notifications`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT pour la table `articles`
--
ALTER TABLE `articles`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pour la table `cards`
--
ALTER TABLE `cards`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT pour la table `creadi_scores`
--
ALTER TABLE `creadi_scores`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT pour la table `credit_requests`
--
ALTER TABLE `credit_requests`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pour la table `financial_profiles`
--
ALTER TABLE `financial_profiles`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT pour la table `installments`
--
ALTER TABLE `installments`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT pour la table `invoices`
--
ALTER TABLE `invoices`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pour la table `kyc_audit_logs`
--
ALTER TABLE `kyc_audit_logs`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pour la table `kyc_documents`
--
ALTER TABLE `kyc_documents`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT pour la table `merchants`
--
ALTER TABLE `merchants`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

--
-- AUTO_INCREMENT pour la table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT pour la table `purchase_orders`
--
ALTER TABLE `purchase_orders`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pour la table `transactions`
--
ALTER TABLE `transactions`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT pour la table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT pour la table `user_wallet`
--
ALTER TABLE `user_wallet`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `cards`
--
ALTER TABLE `cards`
  ADD CONSTRAINT `FKcmanafgwbibfijy2o5isfk3d5` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Contraintes pour la table `creadi_scores`
--
ALTER TABLE `creadi_scores`
  ADD CONSTRAINT `FK5ksgepgsgxt26v5vky2ie49qs` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Contraintes pour la table `credit_requests`
--
ALTER TABLE `credit_requests`
  ADD CONSTRAINT `FKqqaj53cdd5yui6nr9faqxro7r` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Contraintes pour la table `financial_profiles`
--
ALTER TABLE `financial_profiles`
  ADD CONSTRAINT `FKqt6pnf8hhik2gmxj31f4bm63v` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Contraintes pour la table `installments`
--
ALTER TABLE `installments`
  ADD CONSTRAINT `FK7k1jkwkhmkrcepft7pu7cnq00` FOREIGN KEY (`credit_request_id`) REFERENCES `credit_requests` (`id`);

--
-- Contraintes pour la table `invoices`
--
ALTER TABLE `invoices`
  ADD CONSTRAINT `FKa9ees8akliq77jf5h5flucyon` FOREIGN KEY (`order_id`) REFERENCES `purchase_orders` (`id`),
  ADD CONSTRAINT `FKbwr4d4vyqf2bkoetxtt8j9dx7` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Contraintes pour la table `kyc_audit_logs`
--
ALTER TABLE `kyc_audit_logs`
  ADD CONSTRAINT `FKg4tv6b0qv2jgeck0q2hjjv32u` FOREIGN KEY (`kyc_document_id`) REFERENCES `kyc_documents` (`id`);

--
-- Contraintes pour la table `kyc_documents`
--
ALTER TABLE `kyc_documents`
  ADD CONSTRAINT `FKllb8bcbbyo994afdepf7f7j63` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Contraintes pour la table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `FK9y21adhxn0ayjhfocscqox7bh` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Contraintes pour la table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `FKj94hgy9v5fw1munb90tar2eje` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `FKp0wyj2pahks5oh3qs9qstfnsj` FOREIGN KEY (`installment_id`) REFERENCES `installments` (`id`);

--
-- Contraintes pour la table `purchase_orders`
--
ALTER TABLE `purchase_orders`
  ADD CONSTRAINT `FK5dsyovo7wihbep1fluuar8kes` FOREIGN KEY (`credit_request_id`) REFERENCES `credit_requests` (`id`),
  ADD CONSTRAINT `FKfvk9w884rbmso2tiv89e232tx` FOREIGN KEY (`article_id`) REFERENCES `articles` (`id`),
  ADD CONSTRAINT `FKquq1njrq27p9ye5u19f1yvnfp` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
