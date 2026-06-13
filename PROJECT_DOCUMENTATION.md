# CreditTN Project Documentation

Last updated: 2026-05-20

## 1. Project Overview

CreditTN is a full-stack Buy Now, Pay Later platform for Tunisia. It serves:

- Clients who register, verify email, complete KYC, shop products, request credit, pay installments, manage cards, and view notifications.
- Admin users who review KYC, manage users, articles, credit requests, invoices, installments, messages, and notifications.
- Partner/merchant flows represented through articles, purchase orders, invoices, and merchant payout fields.

Runtime services:

- Spring Boot backend API on `8082`.
- Next.js dashboard, admin, and public landing page on `3000`.
- Expo React Native mobile app, exportable to web.
- Socket.IO event relay on `3001`.
- MySQL 8 plus phpMyAdmin through Docker.

## 2. Tech Stack

- Java 17 and Spring Boot: backend API, business rules, schedulers, security, and persistence.
- Spring MVC: REST controllers.
- Spring Security and JWT: authenticated client/admin API access.
- Spring Data JPA and Hibernate: ORM over MySQL.
- MySQL 8: relational application data store.
- Next.js, React, TypeScript, Tailwind CSS: public site, dashboard, and admin interface.
- Expo, React Native, React Native Web, TypeScript: mobile app.
- Socket.IO: real-time admin/client events.
- SMTP: email verification, welcome, reset, and notification messages.
- Didit API: KYC provider integration.
- Docker Compose: local multi-service runtime.
- ESLint, Vitest, Maven tests: frontend and backend verification.

## 3. Architecture

The clean architecture applied here is a layered multi-app architecture:

- Backend owns domain logic, database access, validation, and API contracts.
- Dashboard and mobile apps call backend endpoints through typed API helpers.
- Next.js API routes act as a proxy or compatibility layer; direct database calls were removed from contact/auth login/register routes.
- Socket server only relays real-time events and exposes health.
- Database seed and migration scripts live under `scripts/db`.
- Audit and architecture documents live under `docs`.
- Test fixtures live under `tests/fixtures`.

Important residual architecture note:


Layer roles:

- `controller`: HTTP endpoints and request binding only.
- `service`: business rules and orchestration.
- `repository`: persistence access.
- `entity`: database models and enums.
- `dto`: request and response contracts.
- `security`: JWT, admin auth, and HTTP security.
- `config`: infrastructure configuration.
- `scheduler`: scheduled payment jobs.
- `src/lib` in each frontend: API clients, auth helpers, shared utilities.
- `src/components`: reusable UI.
- `src/pages` or `src/app`: screens/routes.

## 4. Folder Structure

### Before

```text
.
|-- ARCHITECTURE.md
|-- STEP1_INVENTORY.md
|-- STEP2_DATABASE_AUDIT.md
|-- creaditn (2).sql
|-- creaditn (1).sql/
|-- tmp-kyc-test/
|-- uploads/
|-- run-logs/
|-- package-lock.json
|-- nulgit
|-- .gitignore#
|-- creadiTn/
|-- Dashboard_client-main/
|-- frontend mobile/
|-- socket-server/
|-- scripts/
```

Problems found:

- Audit docs and SQL dump were loose at root.
- KYC test images were in a temporary root folder.
- Root contained orphan/generated artifacts.
- Contact message API duplicated backend responsibility.
- The homepage used a light theme while the rest of the product moved dark.

### After

```text
.
|-- .env.example                  # Safe environment template for Docker, backend, dashboard, socket, mail, admin, KYC.
|-- .gitignore                    # Ignores env files, generated builds, logs, uploads, and IDE files.
|-- README.md                     # Short run guide pointing to this document.
|-- PROJECT_DOCUMENTATION.md      # This complete project reference.
|-- docker-compose.yml            # MySQL, backend, dashboard, socket, and phpMyAdmin composition.
|-- docs/
|   |-- ARCHITECTURE.md           # Architecture reference.
|   `-- audit/
|       |-- STEP1_INVENTORY.md    # Exhaustive file-by-file inventory from Step 1.
|       `-- STEP2_DATABASE_AUDIT.md # Database audit and cleanup proposal from Step 2.
|-- scripts/
|   |-- reset-dev-data.ps1        # Local reset helper.
|   |-- test-autopay-live.ps1     # Autopay verification helper.
|   `-- db/
|       |-- initial-data.sql      # Docker MySQL seed dump, formerly root SQL dump.
|       |-- proposed-clean-schema-diff.sql # Proposed database cleanup migration.
|       |-- reset-mysql.sql       # MySQL reset script, cleaned of obsolete tables.
|       |-- reset-postgresql.sql  # PostgreSQL reset helper, cleaned but optional.
|       |-- kyc-security-migration.sql # KYC hardening migration.
|       |-- kyc-manual-review-migration.sql # Manual-review KYC migration.
|       |-- cleanup-test-kyc-users.sql # Test-data cleanup script.
|       `-- README-reset.md       # Reset script notes.
|-- tests/
|   `-- fixtures/
|       `-- kyc/
|           |-- img1.png          # KYC test fixture image.
|           |-- img2.png          # KYC test fixture image.
|           `-- img3.png          # KYC test fixture image.
|-- creadiTn/
|   |-- Dockerfile                # Backend container build.
|   |-- pom.xml                   # Maven dependencies and build settings.
|   |-- mvnw / mvnw.cmd           # Maven wrapper.
|   |-- API_TESTING_GUIDE.md      # Backend API testing notes.
|   |-- ARCHITECTURE_VISUAL.md    # Backend visual architecture notes.
|   |-- LEARNING_GUIDE_FR.md      # French learning notes.
|   `-- src/
|       |-- main/java/com/creaditn/creaditnbackend/
|       |   |-- CreadiTnApplication.java # Backend entry point.
|       |   |-- config/           # Mail, Swagger, Jackson, MVC config.
|       |   |-- controller/       # REST controllers for auth, users, KYC, credit, payments, purchases, support, admin.
|       |   |-- dto/              # API request and response contracts.
|       |   |-- entity/           # JPA entities and enums.
|       |   |-- exception/        # API exception types and global handler.
|       |   |-- kyc/service/      # Didit client and KYC decision rules.
|       |   |-- repository/       # Spring Data repositories.
|       |   |-- scheduler/        # Autopay, overdue, and reminder jobs.
|       |   |-- security/         # JWT, filters, Spring security.
|       |   |-- service/          # Business services.
|       |   `-- util/             # Backend utilities.
|       |-- main/resources/
|       |   |-- application.properties # Runtime configuration.
|       |   |-- schema.sql        # Legacy schema artifact, see known issues.
|       |   `-- schema-bnpl.sql   # BNPL schema artifact.
|       `-- test/java/...         # Backend unit/integration tests.
|-- Dashboard_client-main/
|   |-- Dockerfile                # Dashboard container build.
|   |-- package.json              # Next.js dependencies and scripts.
|   |-- next.config.js            # Next.js config.
|   |-- eslint.config.mjs         # Dashboard lint config.
|   |-- tailwind.config.js        # Dashboard Tailwind config.
|   `-- src/
|       |-- app/                  # Next.js app routes, admin, dashboard, auth, API proxy routes.
|       |-- components/           # Public site and shared UI components.
|       |-- data/                 # Static FAQ and boutique content.
|       `-- lib/                  # Dashboard API, socket, DB compatibility, utility helpers.
|-- frontend mobile/
|   |-- package.json              # Expo app dependencies and scripts.
|   |-- app.json                  # Expo metadata.
|   |-- babel.config.cjs          # Babel config.
|   |-- eslint.config.js          # Mobile lint config.
|   |-- vitest.config.mjs         # Mobile test config used by scripts.
|   |-- public/                   # Static web export assets.
|   `-- src/
|       |-- App.tsx               # Mobile route switch.
|       |-- components/           # Mobile shell and shared cards/components.
|       |-- data/                 # Local shop catalog fallback.
|       |-- lib/                  # API, auth, cart, navigation, socket, theme, utilities.
|       |-- pages/                # Mobile screens.
|       |-- styles.css            # Mobile web global styles.
|       |-- test/                 # Vitest setup and examples.
|       `-- types/                # Ambient type declarations.
`-- socket-server/
    |-- Dockerfile                # Socket server container build.
    |-- package.json              # Socket server dependencies and scripts.
    `-- index.js                  # Socket.IO and health endpoint.
```

Residual root artifacts still present because delete approval was blocked:

- `.gitignore#`: editor backup, safe to delete.
- `nulgit`: orphan text artifact, safe to delete after confirmation.
- root `package-lock.json`: redundant because root has no `package.json`.
- empty folders `creaditn (1).sql`, `tmp-kyc-test`, `uploads`, `run-logs`: safe to delete after confirmation if no local files are needed.

The exhaustive Step 1 file-level inventory remains at `docs/audit/STEP1_INVENTORY.md`.

## 5. Database Schema

Live MySQL database: `creaditn`.

Tables: `admin_notifications`, `articles`, `cards`, `creadi_scores`, `credit_requests`, `financial_profiles`, `installments`, `invoices`, `kyc_audit_logs`, `kyc_documents`, `merchants`, `messages`, `notifications`, `payments`, `purchase_orders`, `transactions`, `user_wallet`, `users`.

### Tables And Columns

- `admin_notifications`: `id bigint PK auto_increment`, `created_at datetime`, `message varchar(2500)`, `order_id bigint`, `is_read bit`, `title varchar(180)`, `transaction_id varchar(70)`, `type enum(INVOICE_GENERATED,NEW_CREDIT_PURCHASE)`, `updated_at datetime`. Stores admin alerts.
- `articles`: `id`, `active`, `boutique_name`, `category`, `created_at`, `description`, `image_url`, `price decimal(12,2)`, `product_name`, `updated_at`, `source_url`. Stores shopping catalog.
- `cards`: `id`, `card_number encrypted varchar(1024)`, `cardholder_name`, `created_at`, `expiry_date`, `is_default`, `last4`, `status enum(ACTIVE,BLOCKED)`, `type enum(MASTERCARD,VISA)`, `updated_at`, `user_id FK`. Stores user card metadata.
- `creadi_scores`: `id`, `badge`, `behavior_score`, `children_score`, `created_at`, `kyc_score`, `level enum(EXCELLENT,GOOD,HIGH_RISK,MEDIUM)`, `marital_score`, `reason`, `risk enum(CRITICAL,HIGH,LOW,MODERATE)`, `salary_score`, `total_score`, `user_id FK`. Stores score snapshots.
- `credit_requests`: `id`, `created_at`, `down_payment`, `monthly_amount`, `number_of_installments`, `product_name`, `status enum(APPROVED,PENDING,REJECTED)`, `total_amount`, `user_id FK`, `financed_amount`, `interest_amount`, `interest_rate`, `total_payable`. Stores BNPL credit applications.
- `financial_profiles`: `id`, `created_at`, `employment_status enum`, `monthly_salary`, `risk_level enum`, `salary_day`, `updated_at`, `user_id unique FK`. Stores financial profile.
- `installments`: `id`, `amount`, `due_date`, `paid_date`, `penalty`, `status enum(OVERDUE,PAID,PENDING)`, `credit_request_id FK`. Stores repayment schedule.
- `invoices`: `id`, article/client/payment snapshot fields, `invoice_number unique`, `transaction_id unique`, `order_id unique FK`, `user_id FK`, financed/interest/merchant/platform amounts, timestamps. Stores invoice snapshots.
- `kyc_audit_logs`: `id`, `admin_id`, `created_at`, `decision enum`, `previous_status enum`, `reason`, `kyc_document_id FK`. Stores manual/admin KYC audit history.
- `kyc_documents`: `id`, document URLs, hashes and unique identity values, extracted identity fields, provider confidence/reason, liveness/fraud fields, admin comment, status, `user_id FK`. Stores KYC submission state.
- `merchants`: `id`, `active`, `address`, `category`, `created_at`, `email`, `logo_url`, `name`, `phone`. Stores merchant partners.
- `messages`: `id int PK`, `name`, `email`, `subject`, `message text`, `status enum(new,unread,read,replied)`, `created_at`, `updated_at`. Stores public contact messages.
- `notifications`: `id`, `created_at`, `message`, `is_read`, `title`, `type enum`, `user_id FK`. Stores client notifications.
- `payments`: `id`, `amount`, `paid_at`, `payment_method`, `transaction_reference unique`, `installment_id FK`, `user_id FK`. Stores installment payments.
- `purchase_orders`: `id`, article snapshot, price fields, credit fields, merchant payout fields, `payment_type enum(CASH,CREDIT)`, `status enum(COMPLETED,CREDIT_ACTIVE,CREDIT_REJECTED)`, `transaction_id unique`, `article_id FK`, `credit_request_id FK nullable`, `user_id FK`, timestamps. Stores checkout orders.
- `transactions`: `id`, `amount`, `created_at`, `description`, `reference unique`, `status`, `type`, `user_id`. Stores ledger entries.
- `user_wallet`: `id`, `balance`, `created_at`, `updated_at`, `user_id unique`. Stores internal demo balance used by payments/autopay.
- `users`: `id`, identity/profile/auth fields, KYC status/provider/fraud fields, email verification OTP fields, account deletion, profile photo, salary/profile signals, timestamps, plus legacy unmapped columns `birth_date`, `gender`, `kyc_verified`, `kyc_verified_at`. Stores registered clients.

### Relationships And Indexes

- `users.email` unique.
- `cards.user_id`, `creadi_scores.user_id`, `credit_requests.user_id`, `notifications.user_id`, `payments.user_id`, `purchase_orders.user_id`, `invoices.user_id` are indexed FKs.
- `financial_profiles.user_id` unique.
- `installments.credit_request_id` indexed FK.
- `payments.installment_id` indexed FK and `transaction_reference` unique.
- `purchase_orders.article_id`, `purchase_orders.credit_request_id`, `purchase_orders.user_id` indexed; `transaction_id` unique.
- `invoices.order_id`, `transaction_id`, `invoice_number` unique.
- `kyc_documents` has unique indexes for CIN/front hash/back hash/Didit identity.
- `kyc_audit_logs.kyc_document_id` indexed FK.
- `transactions.reference` unique.
- `user_wallet.user_id` unique.

### Audit Findings

- No live business table should be dropped immediately.
- `messages` should eventually be renamed to `contact_messages`.
- `user_wallet` should eventually be renamed to `user_wallets`.
- `users.monthly_salary` duplicates `financial_profiles.monthly_salary`, but score logic still reads the user field.
- `schema.sql` still mentions old schema concepts and should be replaced by a generated current schema or a Flyway/Liquibase migration set.
- Proposed migration/diff is in `scripts/db/proposed-clean-schema-diff.sql`.

## 6. Features And Modules

### Auth

Flow: frontend form -> `/api/auth/register` or `/api/auth/login` -> `AuthController` -> `AuthService` -> `UserRepository`, wallet creation, score setup, email service -> JWT response.

Key functions:

- `AuthService.register`: validates uniqueness, hashes password, creates user/wallet, sends verification OTP.
- `AuthService.login`: validates password, email verification, deleted-account state, returns JWT.
- `AuthService.verifyEmail`: validates OTP, marks email verified, returns JWT.

Edge cases:

- Duplicate email/phone.
- Expired OTP or too many attempts.
- Deleted account.
- Unverified email on login.

### KYC

Flow: mobile KYC upload -> `/api/kyc/*` -> `KycController` -> `KycService` and `KycDecisionService` -> storage, Didit, `kyc_documents`, `kyc_audit_logs`, user KYC state.

Key functions:

- `KycService`: upload handling, hashes, identity lock checks, provider call, status transitions.
- `KycDecisionService`: threshold-based verification/manual review/rejection decision.
- `DiditClient`: external KYC provider access.

Edge cases:

- Invalid MIME type or file size.
- Duplicate identity or duplicate document hash.
- Provider failure.
- Manual review threshold.

### Credit And CreadiScore

Flow: mobile credit screen -> `/api/credits/simulate` or `/api/credits/request` -> `CreditController` -> `CreditService` -> score/profile/card/KYC validation -> `credit_requests` and `installments`.

Key functions:

- `CreditCalculator`: computes financed amount, interest, total payable, monthly amount.
- `CreditService.simulate`: preview without persistence.
- `CreditService.createCreditRequest`: validates eligibility and creates installments.
- `CreadiScoreService.calculateScore`: stores score snapshot.

Edge cases:

- Unsupported duration.
- Insufficient profile/KYC/card state.
- Down payment greater than total.
- Credit limit exceeded.

### Shopping And Purchases

Flow: mobile/dashboard shop -> `/api/articles` -> user selects article -> `/api/purchases/checkout` -> `PurchaseService` -> purchase order, optional credit request/installments, invoice, notifications.

Key functions:

- `ArticleService`: list/detail popular products.
- `PurchaseService.checkout`: cash or credit checkout orchestration.
- `InvoiceService`: invoice snapshot and PDF access.

Edge cases:

- Inactive or missing article.
- Cash vs credit branching.
- Credit checkout with missing KYC/card/profile.

### Payments And Autopay

Flow: installments page -> `/api/payments/*` -> `PaymentController` -> `PaymentService` or `AutopayScheduler` -> wallet, card, installment, transaction, notification.

Key functions:

- `PaymentService.payInstallment`: manual installment payment.
- `PaymentService.payAll`: bulk pending installment payment.
- `PaymentService.updateAutopay`: toggles user autopay.
- `AutopayScheduler.processDuePayments`: runs due installment payments.

Edge cases:

- No active default card.
- Insufficient internal wallet balance.
- Already paid installment.
- Overdue penalty.

### Cards

Flow: mobile Cards screen -> `/api/cards/*` -> `CardController` -> `CardService` -> encrypted card metadata.

Key functions:

- `CardService.addCard`: stores encrypted card and last4.
- `CardService.setDefaultCard`: enforces one default.
- `CardService.blockCard`: blocks card from future payment.

Edge cases:

- Expired card.
- Invalid number/CVV shape.
- Default blocked card.

### Support And Contact Messages

Flow: public support/dashboard contact form -> Next `/api/contact` -> backend `/api/support/contact-messages` -> `ContactMessageService` -> `messages`.

Key functions:

- `ContactMessageService.create`: validates and inserts public contact message.
- `ContactMessageService.listRecent`: returns recent admin message list.
- `SupportService`: FAQ, feedback, support tickets.

Edge cases:

- Empty name/email/subject/message.
- Contact list is currently public for dashboard compatibility, see TODO.

### Admin Dashboard

Flow: admin pages -> dashboard API helper or backend proxy -> `/api/admin/*` -> `AdminController` and specialized admin controllers -> services/repositories.

Key functions:

- Admin login and token generation.
- KYC approve/reject.
- Credit approve/reject.
- Article CRUD and image upload.
- Invoice and purchase views.
- Message/notification views.

Edge cases:

- Admin credentials missing from environment.
- Manual KYC state transitions.
- Article image upload size/type.

### Notifications And Realtime

Flow: backend service creates notification/admin event -> `SocketEventService` -> socket server `/emit` -> connected dashboard/mobile clients.

Key functions:

- `SocketEventService`: emits backend events with shared secret.
- `socket-server/index.js`: authenticates emit requests and broadcasts events.
- `useSocket.ts` and mobile `socket.ts`: frontend socket clients.

Edge cases:

- Socket secret mismatch.
- Socket server offline.
- Client reconnect behavior.

## 7. API Reference

Auth column values:

- `Public`: no JWT required.
- `User`: user JWT required.
- `Admin`: admin token required.
- `Mixed`: endpoint allows both compatibility and protected variants depending on parameters.

### Spring Backend API

| Method | Path | Input | Output | Auth |
|---|---|---|---|---|
| POST | `/api/auth/register` | `RegisterRequest` | `AuthResponse` | Public |
| POST | `/api/auth/login` | `AuthRequest` | `AuthResponse` | Public |
| POST | `/api/auth/forgot-password/request` | `ForgotPasswordRequest` | `ApiResponse` | Public |
| POST | `/api/auth/forgot-password/confirm` | `ForgotPasswordConfirmRequest` | `ApiResponse` | Public |
| POST | `/api/auth/forgot-email` | `ForgotEmailRequest` | `ApiResponse` | Public |
| POST | `/api/auth/forgot-email/reveal` | `RevealEmailRequest` | `ApiResponse` | Public |
| POST | `/api/auth/forgot-email/update` | `UpdateRecoveredEmailRequest` | `ApiResponse` | Public |
| POST | `/api/auth/verify-email` | `VerifyEmailRequest` | `AuthResponse` | Public |
| POST | `/api/auth/resend-verification` | `ResendVerificationRequest` | `ApiResponse` | Public |
| GET | `/api/users/health` | none | health message | Public |
| GET | `/api/users/me` | JWT | `UserDto` | User |
| GET | `/api/users/profile` | `userId` | `UserDto` | User |
| GET | `/api/users/account-status` | JWT | `AccountStatusDto` | User |
| PUT | `/api/users/me` | profile fields | `UserDto` | User |
| GET | `/api/users/{id}` | path id | `UserDto` | User/Admin |
| PUT | `/api/users/password` | `PasswordChangeRequest` | `ApiResponse` | User |
| POST | `/api/users/photo` | multipart | `UserDto` | User |
| DELETE | `/api/users/delete` | JWT | `ApiResponse` | User |
| GET | `/api/articles` | optional filters | article list | Public |
| GET | `/api/articles/popular` | none | article list | Public |
| GET | `/api/articles/{id}` | path id | article | Public |
| GET | `/api/merchants` | none | merchant list | Public |
| GET | `/api/merchants/category/{category}` | category | merchant list | Public |
| GET | `/api/merchants/{id}` | path id | merchant | Public |
| POST | `/api/kyc/upload` | upload request | KYC result | User |
| POST | `/api/kyc/upload-multipart` | multipart docs | KYC result | User |
| POST | `/api/kyc/verify` | multipart docs | KYC result | User |
| GET | `/api/kyc/status` | `userId` | KYC status | User |
| POST | `/api/credits/simulate` | `CreditSimulationRequest` | `CreditSimulationResponse` | User |
| POST | `/api/credits/request` | `CreditRequestDto` | `CreditRequestResponse` | User |
| GET | `/api/credits/my-requests` | `userId` | credit list | User |
| GET | `/api/credits/my` | `userId` | credit list | User |
| GET | `/api/credits/{id}` | path id | credit detail | User/Admin |
| GET | `/api/credits/balance` | `userId` | `CreditBalanceResponse` | User |
| GET | `/api/credits/{creditId}/installments` | path id | installment list | User |
| GET | `/api/credits/my-installments` | `userId` | installment list | User |
| GET | `/api/credits/my-installments/pending` | `userId` | installment list | User |
| POST | `/api/creadi-score/calculate/{userId}` | path id | score | User/Admin |
| GET | `/api/creadi-score/latest` | `userId` | score | User |
| POST | `/api/profile/create` | financial profile | profile | User |
| GET | `/api/profile/get` | `userId` | profile | User |
| GET | `/api/profile/has-profile` | `userId` | boolean/status | User |
| POST | `/api/profile` | financial profile | profile | User |
| GET | `/api/profile` | `userId` | profile | User |
| POST | `/api/cards/add` | card fields | `CardDto` | User |
| GET | `/api/cards/user` | `userId` | card list | User |
| GET | `/api/cards/default` | `userId` | card | User |
| PUT | `/api/cards/set-default` | card/user ids | `CardDto` | User |
| DELETE | `/api/cards/block` | card/user ids | `ApiResponse` | User |
| POST | `/api/cards` | `CardCreateRequest` | `CardDto` | User |
| GET | `/api/cards` | `userId` | card list | User |
| PUT | `/api/cards/{cardId}/default` | path id | `CardDto` | User |
| PUT | `/api/cards/{cardId}/block` | path id | `CardDto` | User |
| POST | `/api/purchases/checkout` | `PurchaseArticleRequest` | `PurchaseOrderResponse` | User |
| GET | `/api/purchases/my` | `userId` | purchase list | User |
| POST | `/api/payments` | `PaymentRequest` | `PaymentDto` | User |
| POST | `/api/payments/installments/{installmentId}/pay` | path id | `PaymentDto` | User |
| GET | `/api/payments/my-payments` | `userId` | payment list | User |
| POST | `/api/payments/payAll` | `userId` | `PayAllResponse` | User |
| POST | `/api/payments/pay-all` | `userId` | `PayAllResponse` | User |
| GET | `/api/payments/reference/{ref}` | path ref | payment | User |
| GET | `/api/payments/methods` | `userId` | methods | User |
| PUT | `/api/payments/autopay` | enabled flag | settings | User |
| GET | `/api/payments/autopay` | `userId` | settings | User |
| POST | `/api/payments/autopay/process-due` | user/date params | result | User/Admin/dev |
| GET | `/api/payments/wallet-balance` | `userId` | balance | User |
| GET | `/api/payments/receipt/{paymentId}` | path id | receipt/PDF | User |
| GET | `/api/dashboard` | `userId` | dashboard data | User |
| GET | `/api/notifications` | `userId` | notifications | User |
| GET | `/api/notifications/unread` | `userId` | notifications | User |
| GET | `/api/notifications/unread-count` | `userId` | count | User |
| PUT | `/api/notifications/{id}/read` | path id | notification | User |
| GET | `/api/transactions` | `userId` | transaction list | User |
| GET | `/api/rewards/cashback` | `userId` | cashback | User |
| GET | `/api/rewards/offers` | none | offers | User |
| GET | `/api/rewards/history` | `userId` | history | User |
| GET | `/api/support/faq` | none | FAQ list | Public |
| GET | `/api/support/tickets` | `userId` | tickets | User |
| POST | `/api/support/tickets` | support ticket | ticket | User |
| POST | `/api/support/feedback` | feedback | response | User |
| GET | `/api/support/contact-messages` | none | message list | Public for dashboard compatibility |
| POST | `/api/support/contact-messages` | contact message | contact message | Public |
| POST | `/api/admin/login` | admin credentials | admin token | Public |
| GET | `/api/admin/stats` | admin token | stats | Admin |
| GET | `/api/admin/credits` | admin token | credits | Admin |
| GET | `/api/admin/installments` | admin token | installments | Admin |
| GET | `/api/admin/users` | admin token | users | Admin |
| DELETE | `/api/admin/users/{id}` | path id | response | Admin |
| GET | `/api/admin/kyc/pending` | admin token | KYC list | Admin |
| GET | `/api/admin/kyc/{id}` | path id | KYC detail | Admin |
| PUT/POST | `/api/admin/kyc/{id}/approve` | decision body | result | Admin |
| PUT/POST | `/api/admin/kyc/{id}/reject` | reason body | result | Admin |
| GET | `/api/admin/credits/pending` | admin token | pending credits | Admin |
| PUT | `/api/admin/credits/{id}/approve` | path id | result | Admin |
| PUT | `/api/admin/credits/{id}/reject` | path id | result | Admin |
| GET | `/api/admin/activity` | admin token | activity feed | Admin |
| DELETE | `/api/admin/cleanup/users` | admin token | result | Admin/dev |
| GET | `/api/admin/purchases/credit` | admin token | credit purchases | Admin |
| GET | `/api/admin/notifications` | admin token | notifications | Admin |
| GET | `/api/admin/notifications/unread` | admin token | notifications | Admin |
| GET | `/api/admin/notifications/unread-count` | admin token | count | Admin |
| PUT | `/api/admin/notifications/{id}/read` | path id | notification | Admin |
| GET | `/api/admin/invoices` | admin token | invoices | Admin |
| GET | `/api/admin/invoices/{id}` | path id | invoice | Admin |
| GET | `/api/admin/invoices/{id}/pdf` | path id | PDF | Admin |
| GET | `/api/admin/articles` | admin token | articles | Admin |
| POST | `/api/admin/articles` | `ArticleRequest` | article | Admin |
| PUT | `/api/admin/articles/{id}` | `ArticleRequest` | article | Admin |
| DELETE | `/api/admin/articles/{id}` | path id | response | Admin |
| POST | `/api/admin/articles/upload-image` | multipart | image URL | Admin |
| POST | `/api/admin/dev-reset` | reset token | result | Admin/dev |

### Next.js Dashboard API Routes

| Method | Path | Purpose | Auth |
|---|---|---|---|
| GET/POST/PUT/PATCH/DELETE | `/api/backend/[...path]` | Generic backend proxy to `BACKEND_URL`. | Mirrors backend |
| POST | `/api/auth/login` | Compatibility proxy to backend login. | Public |
| POST | `/api/auth/register` | Compatibility proxy to backend register. | Public |
| POST | `/api/contact` | Compatibility proxy to backend contact messages. | Public |
| GET | `/api/messages` | Compatibility proxy to backend contact messages. | Public |
| GET | `/api/test-connection` | Backend health proxy. | Public |
| POST | `/api/scrape-product` | Product scraping helper for admin/article workflows. | Admin intended |

### Socket Server

| Method | Path | Purpose | Auth |
|---|---|---|---|
| GET | `/health` | Socket server health. | Public |
| POST | `/emit` | Broadcast event to Socket.IO clients. | `SOCKET_EMIT_SECRET` |

## 8. Environment Variables

Root `.env.example` now lists the expected local variables.

- `DB_ROOT_PASSWORD`, `DB_USER`, `DB_PASSWORD`, `DB_PORT`, `PHPMYADMIN_PORT`: MySQL/phpMyAdmin setup.
- `JWT_SECRET`: backend JWT signing secret, at least 32 random characters.
- `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM`, `MAIL_SMTP_*`: SMTP settings.
- `ADMIN_NOTIFICATION_EMAIL`, `ADMIN_NOTIFICATION_EMAIL_ENABLED`: admin email alerts.
- `SOCKET_EMIT_SECRET`: shared backend/socket emit secret.
- `SOCKET_DEBUG`: enables socket debug output when true.
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`: Docker admin credentials mapped into backend.
- `APP_DEV_RESET_ENABLED`, `APP_DEV_RESET_TOKEN`: optional dev reset endpoint control.
- `APP_CREDIT_MAX_PER_USER`: backend credit cap override.
- `BACKEND_URL`: dashboard server-side URL for backend proxy calls.
- `NEXT_PUBLIC_API_URL`: browser-visible dashboard API base, usually `/api/backend`.
- `NEXT_PUBLIC_SOCKET_URL`: browser-visible Socket.IO URL.
- `DIDIT_API_KEY`, `DIDIT_API_URL`, `DIDIT_FALLBACK_ON_ERROR`: KYC provider settings.
- `KYC_*`: KYC thresholds, file limits, and allowed MIME types.
- `EXPO_PUBLIC_API_BASE_URL`: mobile app backend URL for Expo.

## 9. How To Run

### Docker

```bash
cp .env.example .env
docker compose up --build
```

URLs:

- Dashboard/admin/public site: `http://localhost:3000`
- Backend API: `http://localhost:8082`
- Swagger UI: `http://localhost:8082/swagger-ui.html`
- Socket health: `http://localhost:3001/health`
- phpMyAdmin: `http://localhost:8081`

The Docker database imports `scripts/db/initial-data.sql` only when the `mysql_data` volume is created for the first time.

### Backend

```bash
cd creadiTn
.\mvnw.cmd test
.\mvnw.cmd spring-boot:run
```

### Dashboard

```bash
cd Dashboard_client-main
npm.cmd install
npm.cmd run lint
npm.cmd run build
npm.cmd run dev
```

### Mobile

```bash
cd "frontend mobile"
npm.cmd install
npm.cmd run lint
npm.cmd test
npm.cmd run build
npm.cmd start
```

### Database Migrations

Current development mode uses Hibernate `ddl-auto=update`. For production, introduce Flyway or Liquibase and convert the proposed diff in `scripts/db/proposed-clean-schema-diff.sql` into ordered migrations.

## 10. Changes Applied In This Pass

Moved:

- `STEP1_INVENTORY.md` -> `docs/audit/STEP1_INVENTORY.md`
- `STEP2_DATABASE_AUDIT.md` -> `docs/audit/STEP2_DATABASE_AUDIT.md`
- `ARCHITECTURE.md` -> `docs/ARCHITECTURE.md`
- `creaditn (2).sql` -> `scripts/db/initial-data.sql`
- `tmp-kyc-test/img1.png`, `img2.png`, `img3.png` -> `tests/fixtures/kyc/`

Added:

- `PROJECT_DOCUMENTATION.md`
- `Dashboard_client-main/src/lib/server/backend.ts`
- `creadiTn/src/main/java/com/creaditn/creaditnbackend/dto/ContactMessageDto.java`
- `creadiTn/src/main/java/com/creaditn/creaditnbackend/dto/ContactMessageRequest.java`
- `creadiTn/src/main/java/com/creaditn/creaditnbackend/service/ContactMessageService.java`

Updated:

- `docker-compose.yml`: cleaned config, moved seed mount to `scripts/db/initial-data.sql`, added socket debug env.
- `.env.example`: expanded backend/dashboard/socket/KYC env template.
- `.gitignore`: cleaned generated output, logs, env, uploads, IDE ignores.
- `README.md`: short current run guide.
- `Dashboard_client-main/src/app/globals.css`: dark baseline theme.
- `Dashboard_client-main/src/components/Hero.tsx`: dark modern homepage hero.
- `Dashboard_client-main/src/components/Navbar.tsx`: dark navigation.
- `Dashboard_client-main/src/components/Features.tsx`, `HowItWorks.tsx`, `PartnersPreview.tsx`: dark matching sections.
- `Dashboard_client-main/src/components/ContactForm.tsx`: dark support contact UI.
- `Dashboard_client-main/src/app/support/page.tsx`: dark support page and fixed message status display.
- `Dashboard_client-main/src/app/api/contact/route.ts`, `api/messages/route.ts`, `api/test-connection/route.ts`: backend proxy routes.
- `Dashboard_client-main/src/app/api/auth/login/route.ts`, `api/auth/register/route.ts`: backend proxy routes.
- `socket-server/index.js`: debug logging is now behind `SOCKET_DEBUG`; startup uses clean stdout.
- `creadiTn/src/main/java/.../service/EmailService.java`: cleaned encoding/comments and escaped dynamic email values.
- `creadiTn/src/main/java/.../service/SupportService.java`: cleaned text/encoding.
- `creadiTn/src/main/java/.../service/DevDatabaseResetService.java`: removed obsolete reset targets.
- `creadiTn/src/main/java/.../security/SecurityConfig.java`: allowed public support contact messages.
- `creadiTn/src/main/java/.../controller/SupportController.java`: added backend contact-message list/create endpoints.
- `scripts/db/reset-mysql.sql`, `scripts/db/reset-postgresql.sql`: removed obsolete table references.
- `frontend mobile/src/lib/socket.ts`, `Cards.tsx`, `Installments.tsx`: removed debug/mojibake comments.

Deleted:

- No destructive deletion was completed. Orphan cleanup was identified but blocked by approval/usage limits, so files were kept and listed above.

## 11. Verification Results

Completed checks:

- Backend: `.\mvnw.cmd test` passed, 27 tests, 0 failures.
- Dashboard: `npm.cmd run lint` passed.
- Dashboard: `npm.cmd run build` passed.
- Mobile: `npm.cmd run lint` passed.
- Mobile: `npm.cmd test` passed, 7 tests.
- Mobile: `npm.cmd run build` passed, Expo web export completed.
- Docker: `docker compose build backend dashboard socket-server` passed.
- Docker: `docker compose up -d db backend socket-server dashboard phpmyadmin` passed.
- Docker health: backend, db, and socket are healthy; dashboard is running.

Smoke traces:

- `GET http://localhost:8082/api/users/health`: returned `User service is healthy`.
- `GET http://localhost:3001/health`: returned socket status `ok`.
- `GET http://localhost:3000`: returned HTTP 200 and homepage hero content.
- `POST /api/support/contact-messages`: created a contact message.
- `GET /api/support/contact-messages`: returned recent messages.
- `POST /api/contact` through dashboard: created a proxied contact message.
- `GET /api/messages` through dashboard: returned proxied message count.
- `POST /api/auth/register`: created a test user.

## 12. Known Issues / TODOs

- Remove root orphan artifacts after explicit delete approval: `.gitignore#`, `nulgit`, root `package-lock.json`, empty `creaditn (1).sql`, `tmp-kyc-test`, `uploads`, `run-logs`.
- Replace legacy `creadiTn/src/main/resources/schema.sql` with a current migration-based schema.
- Convert `scripts/db/proposed-clean-schema-diff.sql` into Flyway/Liquibase migrations before production.
- Rename `messages` to `contact_messages` and `user_wallet` to `user_wallets` in a coordinated migration.
- Protect `GET /api/support/contact-messages` with admin auth once dashboard admin message retrieval uses admin credentials cleanly.
- Add browser-level Playwright visual checks for homepage/admin/mobile web after UI theme changes.
- Add full authenticated purchase/credit E2E test with controlled email verification setup.

