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
  `type` enum('KYC_VALIDATED','CREDIT_APPROVED','CREDIT_REJECTED','PAYMENT_REMINDER','PAYMENT_PENDING','PAYMENT_CONFIRMED','PAYMENT_FAILED','PAYMENT_REFUNDED','INSTALLMENT_OVERDUE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `notifications`
--


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
  `password_reset_requested_at` datetime(6) DEFAULT NULL,
  `password_reset_token_expiry` datetime(6) DEFAULT NULL,
  `password_reset_token_hash` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
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
  ADD UNIQUE KEY `UK6dotkott2kjsp8vw4d0m25fb7` (`email`),
  ADD KEY `idx_users_password_reset_token_hash` (`password_reset_token_hash`);

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
