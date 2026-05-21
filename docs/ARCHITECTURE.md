# CreadiTN Architecture

Last updated: 2026-05-20

## Overall App Structure

CreadiTN is a BNPL/credit application made of five runtime services:

- `creadiTn`: Spring Boot backend on port `8082`.
- `frontend mobile`: Expo/React Native mobile client, also exportable for web.
- `Dashboard_client-main`: Next.js dashboard/admin frontend on port `3000`.
- `socket-server`: Socket.IO event relay on port `3001`.
- `phpmyadmin`: Docker phpMyAdmin for the application database on port `8081`.

The Docker composition starts MySQL, phpMyAdmin, the backend, the dashboard, and the socket server. Uploaded files are stored in the backend upload directory and persisted through the `uploads_data` Docker volume.

## Tech Stack

- Backend: Java 17, Spring Boot 4, Spring MVC, Spring Security, Spring Data JPA, Hibernate, Jakarta Validation.
- Database: MySQL 8 in Docker. The code defaults to MySQL but can be pointed to another JDBC URL through environment variables.
- Mobile frontend: React Native, Expo, TypeScript, React Native Web, Vitest, ESLint.
- Dashboard frontend: Next.js, TypeScript, Tailwind CSS.
- Integrations: Didit standalone ID verification API, SMTP mail, Socket.IO.

## Backend Modules

- `controller`: REST endpoints for auth, users, KYC, credit, payments, purchases, invoices, cards, notifications, support, admin, and dashboard data.
- `service`: Business logic and transaction boundaries.
- `entity`: JPA entities mapped to the production schema.
- `repository`: Spring Data JPA repositories.
- `security`: JWT generation/validation, request authentication filters, and Spring Security rules.
- `dto`: Request and response contracts shared with the mobile/dashboard apps.
- `kyc/service`: Didit API client and strict KYC decision rules.
- `scheduler`: Payment reminder, overdue installment, and autopay jobs.
- `config`: Mail, CORS, Jackson, Swagger, and web resource config.

## Mobile Frontend Structure

- `src/App.tsx`: top-level route switching.
- `src/pages`: mobile screens such as Login, Register, Home, Credit, KYC, Cards, Installments, Profile, Shops, and Support.
- `src/components`: shared mobile shell components such as `MobileLayout` and `BottomNav`.
- `src/lib/api.ts`: backend API client and TypeScript contracts.
- `src/lib/auth.tsx`: auth state and token storage.
- `src/lib/app-navigation.tsx`: app navigation state.
- `src/lib/creditPreview.ts`: credit preview calculations used by the credit screen and tests.

The Home screen uses only real backend-derived data: profile, credit usage, score, KYC status, installments, notifications, popular articles, and recent payments. Wallet/solde balance is intentionally not rendered in mobile UI.

## Admin/Dashboard Structure

- `Dashboard_client-main/src/app`: Next.js app routes.
- `admin/*`: admin pages for users, KYC, invoices, credits, articles, installments, messages, and notifications.
- `api/backend/[...path]`: backend proxy route.
- `src/lib/api.ts`: dashboard backend client.
- `src/lib/useSocket.ts`: real-time updates.

## Database Schema Overview

Main tables:

- `users`: identity, auth, email verification, KYC state, profile signals, and account deletion state.
- `user_wallet`: internal simulated payment balance used by backend payment logic. Not shown in mobile UI.
- `cards`: encrypted/masked card metadata and default-card state.
- `financial_profiles`: salary, salary day, employment status, and risk level.
- `kyc_documents`: uploaded KYC document URLs, hashes, Didit identifiers, extracted identity fields, biometric metrics, provider confidence/reason, fraud signals, status, and admin comments.
- `creadi_scores`: historical Creadi score snapshots.
- `credit_requests`: credit request principal, down payment, interest, duration, status, and user relation.
- `installments`: repayment schedule per credit request.
- `payments`: payment records linked to installments.
- `transactions`: transaction ledger entries.
- `purchase_orders`: partner article checkout records.
- `invoices`: invoice records generated for purchases.
- `notifications` and `admin_notifications`: user/admin notification feeds.
- `articles`: partner catalog items.
- `merchants`, `messages`: currently empty in the verified Docker database, but still mapped by application/admin features.

Database cleanup recommendation:

- Do not drop `user_wallet`; it is still used by backend payment/autopay logic even though mobile hides balances.
- Do not drop `merchants` or `messages` without confirming dashboard/support requirements; they are empty in the verified database but have code paths.
- Keep `creadi_scores` as history rather than a single score column.
- Consider a migration tool such as Flyway/Liquibase before production; `ddl-auto=update` is convenient but risky for controlled deployments.

Local database note:

- Docker exposes the application MySQL database on host port `3307`, while the container listens on `3306`.
- If phpMyAdmin is connected to `127.0.0.1:3306`, it may show a different local/XAMPP database with empty tables.
- The bundled Docker phpMyAdmin is available at `http://localhost:8081` and connects to the real Docker MySQL service.
- To inspect the real app database from phpMyAdmin or another client, connect to host `127.0.0.1`, port `3307`, database `creaditn`, user `creaditn`, and the configured Docker password.

Seed data note:

- The MySQL init script `creaditn (1).sql` only runs the first time the `mysql_data` Docker volume is created.
- If the database is empty after a rebuild, the volume likely already existed; delete the volume (dev only) to re-import the seed data.

Admin credentials (Docker):

- `APP_ADMIN_EMAIL` and `APP_ADMIN_PASSWORD` are injected from `.env` (`ADMIN_EMAIL` and `ADMIN_PASSWORD`).

## Authentication And Authorization Flow

1. User registers through `POST /api/auth/register`.
2. Backend normalizes email, hashes the password, creates the user, creates the internal wallet, calculates an initial score, stores an email OTP, and sends the verification email.
3. User verifies email through `POST /api/auth/verify-email`.
4. Backend marks `email_verified=true`, clears OTP fields, sends the welcome email, and returns a JWT.
5. Login through `POST /api/auth/login` checks password, deleted-account state, email verification, then returns a JWT.
6. Protected endpoints require `Authorization: Bearer <token>`.
7. KYC endpoints additionally enforce that the requested `userId` matches the JWT user id.

## Credit / BNPL Flow

1. User completes KYC, adds a payment card, and completes a financial profile.
2. Credit simulation validates duration and calculates down payment, principal, interest, total repayable, and schedule preview.
3. Credit request validates KYC, default active card, financial profile, down payment, and available limit.
4. Approved requests generate installments and send notifications.
5. Partner checkout creates a purchase order, credit request, installments, invoice, admin notification, and user notification.
6. Payment checks ownership, active default card, installment amount, internal backend balance, then writes payment, updates installment, writes transaction, updates payment behavior, recalculates score, and sends notification/email.

## Auto-Payment Flow

Auto-payment is controlled by the `users.autopay` flag and processed by `AutopayScheduler`.

1. Mobile Profile screen reads the current status from `GET /api/payments/autopay?userId=X`.
2. When the user enables auto-payment, mobile calls `PUT /api/payments/autopay?userId=X` with `{ "enabled": true }`.
3. Backend saves the new autopay state and returns the confirmation message `Auto-payment is now active.`.
4. Mobile displays the backend message in an alert. If the request fails, the switch is rolled back and an error alert is shown.
5. Enabling auto-payment also immediately runs due-payment processing for that user, so installments already due today or earlier can be paid without waiting for the next cron execution.
6. The daily cron job still runs automatically at 08:00 and processes unpaid installments for all users with autopay enabled.

Due-date execution rules:

- Autopay selects unpaid installments with status `PENDING` or `OVERDUE`.
- An installment is eligible when `due_date <= processingDate`.
- The normal processing date is `LocalDate.now()`.
- The manual test endpoint accepts a processing date: `POST /api/payments/autopay/process-due?userId=X&asOfDate=2026-06-03`.
- This test parameter is useful because changing the system date after the 08:00 cron time does not immediately fire the scheduled job.

For every eligible installment, the scheduler:

1. Checks that the installment owner has `autopay=true`.
2. Calculates `total = amount + penalty` where missing penalty counts as `0`.
3. Checks the internal `user_wallet` balance.
4. If the balance is insufficient, sends an `Autopay Failed` notification and leaves the installment unpaid.
5. If the balance is sufficient, deducts the wallet, marks the installment `PAID`, stores `paidDate`, records a `PAYMENT` transaction with an `AUTO-...` reference, increases `paymentScoreModifier` by `10`, recalculates the Creadi score, and sends an `Autopay Successful` notification.

## CreadiScore Calculation

`CreadiScoreService.calculateScore` calculates a new score snapshot and stores it in `creadi_scores`. The final score is clamped between `0` and `1000`.

Formula:

```text
totalScore = kycScore + salaryScore + maritalScore + childrenScore + behaviorScore
totalScore = min(1000, max(0, totalScore))
```

Score components:

- `kycScore` max `300`: `300` when `user.kycStatus == VERIFIED`, otherwise `0`.
- `salaryScore` max `300`: `300` for salary `>= 2000`, `200` for salary `>= 1000`, `100` for salary `>= 500`, `50` for salary below `500`, and `0` when salary is missing or invalid.
- `maritalScore` max `100`: `100` for married, `70` for divorced/widowed, `50` for single, missing, or unknown values.
- `childrenScore` max `100`: `100` for `0` children, `50` for `1-2` children or missing value, `20` for more than `2` children.
- `behaviorScore` max `200`: starts at `0`, adds up to `100` for fast KYC completion, adds `100` when no fraud flag is detected, subtracts `50` for `3+` failed KYC attempts, then adds `paymentScoreModifier`. The result is clamped to `0-200`.

Fast KYC behavior points:

- `+100` when verified KYC was completed within `48` hours after account creation.
- `+60` when completed within `168` hours.
- `+30` when completed later.

Payment behavior:

- Successful manual and automatic payments improve `paymentScoreModifier`.
- The auto-payment scheduler adds `+10` after each successful autopay installment.
- Because behavior score is capped at `200`, payment behavior can improve the score but cannot push this component above `200`.

Score classification:

- `800-1000`: `EXCELLENT`, risk `LOW`.
- `600-799`: `GOOD`, risk `MODERATE`.
- `400-599`: `MEDIUM`, risk `HIGH`.
- `0-399`: `HIGH_RISK`, risk `CRITICAL`.

Badge:

- `GOLD` for score `>= 900`.
- `SILVER` for score `>= 700`.
- `BRONZE` for score `>= 500`.
- No badge below `500`.

Credit limit calculation:

- The maximum credit limit is calculated from salary and marital status, then adjusted by payment behavior.
- Base credit is `1000` for salary below `1000`, `2000` for salary below `2000`, `4000` for salary below `4000`, and `6000` for salary `>= 4000`.
- Married users receive a `10%` base-credit bonus.
- `paymentScoreModifier` changes the payment factor using `1.0 + modifier / 1000.0`.
- Users with both overdue and pending installments receive a penalty factor capped at `25%`.
- The final demo BNPL guardrail caps the returned credit limit at `2000`.

## KYC Flow With Didit

1. Mobile uploads CIN front, CIN back, mandatory selfie, and profile signals to `POST /api/kyc/verify`.
2. Backend rejects empty, oversized, corrupted, executable, or unsupported uploads before saving. Allowed image MIME types are configured by `KYC_ALLOWED_MIME_TYPES`; default max size is `KYC_MAX_IMAGE_BYTES=5242880`.
3. Backend stores files under `uploads/kyc/{userId}` and hashes document bytes for duplicate detection.
4. Backend calls Didit standalone APIs:
   - ID Verification: `POST /v3/id-verification/` with `front_image`, `back_image`, `perform_document_liveness=true`, and `vendor_data`.
   - Passive Liveness: `POST /v3/passive-liveness/` with `user_image`.
   - Face Match: `POST /v3/face-match/` with `user_image` and `ref_image`.
5. Didit responses are parsed for request id, identity fields, document authenticity, face match score, liveness score, spoof signal, provider confidence, and provider reason.
6. `KycDecisionService` is the approval gate. Auto-approval requires document authenticity, selfie presence, no spoof signal, liveness score at/above threshold, face match score at/above threshold, and provider confidence at/above threshold.
7. Scores below reject thresholds become `REJECTED`; borderline scores become `MANUAL_REVIEW`; missing critical biometric/provider signals do not auto-approve.
8. Duplicate protection rejects reused CIN values, extracted identity numbers, Didit identity IDs, and repeated document hashes across different active accounts. Local/dev ignores deleted accounts by default to avoid stale test locks; production can set `KYC_IDENTITY_LOCK_INCLUDE_DELETED=true` to keep identity documents permanently locked after account deletion.
9. KYC approval, rejection, or manual-review state recalculates the user's Creadi score and stores audit metrics on `kyc_documents`.

KYC thresholds are configurable:

- `KYC_FACE_MATCH_THRESHOLD` default `0.75`
- `KYC_FACE_MATCH_MANUAL_REVIEW_THRESHOLD` default `0.70`
- `KYC_LIVENESS_THRESHOLD` default `0.70`
- `KYC_LIVENESS_MANUAL_REVIEW_THRESHOLD` default `0.65`
- `KYC_PROVIDER_CONFIDENCE_THRESHOLD` default `0.75`
- `KYC_PROVIDER_CONFIDENCE_MANUAL_REVIEW_THRESHOLD` default `0.70`
- `KYC_IDENTITY_LOCK_INCLUDE_DELETED` default `false` locally; set `true` in production for stronger anti-reuse controls.

Provider failures such as insufficient credits, timeouts, malformed responses, missing key, or missing biometric fields persist a safe `REJECTED` or `MANUAL_REVIEW` result instead of leaving users stuck in `PENDING`. Offline fallback never auto-approves.

Current local test result: Didit returned an insufficient-credits 403 from the provider account, so KYC is persisted as `MANUAL_REVIEW`, the raw provider error is kept in backend audit fields, and mobile receives a clean manual-review message.

References:

- https://docs.didit.me/standalone-apis/id-verification
- https://docs.didit.me/standalone-apis/passive-liveness
- https://docs.didit.me/standalone-apis/face-match

## SMTP / Email Flow

SMTP settings come from environment variables:

- `MAIL_HOST`
- `MAIL_PORT`
- `MAIL_USERNAME`
- `MAIL_PASSWORD`
- `MAIL_FROM`
- SMTP auth/TLS timeout settings

Email service sends:

- Registration email verification OTP.
- Welcome email after email verification.
- Password reset OTP.
- Password changed confirmation.
- Payment confirmation and important notification emails.

Email failures are logged and do not abort unrelated flows. Missing SMTP credentials are logged as warnings and treated as a no-send condition.

## Important Functions

- `AuthService.register`: creates the user and wallet, calculates the initial score, stores OTP, and sends the verification email. It is transactional so user and wallet creation stay consistent.
- `AuthService.login`: validates credentials, deleted-account state, email verification, and issues JWT.
- `CreadiScoreService.calculateScore`: creates a user-specific 0-1000 score from KYC status, salary, marital status, children count, fraud/failed KYC signals, and payment behavior.
- `CreadiScoreService.getLatestScore`: returns the latest score or lazily calculates one if missing.
- `KycService.uploadAndVerify`: validates and stores KYC files, checks duplicate identities, calls Didit, persists biometric metrics, applies the strict decision result, and updates user profile signals.
- `KycDecisionService.evaluate`: central approval gate for selfie presence, document authenticity, face match, liveness, spoof detection, provider confidence, duplicate identity, manual-review routing, and rejection reasons.
- `DiditClient.verifyIdentity`: wraps Didit ID Verification, Passive Liveness, and Face Match calls; converts provider errors into explicit rejected/manual-review KYC results.
- `CreditService.createCreditRequest`: validates credit preconditions and generates installments for approved requests.
- `PurchaseService.checkout`: orchestrates cash or credit partner purchases.
- `PaymentService.makePayment`: verifies installment ownership, deducts backend payment balance, writes payment/transaction records, marks installment paid, and recalculates score.
- `PaymentController.setAutopay`: saves the user's autopay setting, returns a confirmation message, and immediately processes due autopay installments when enabling autopay.
- `AutopayScheduler.processAutopayments`: daily 08:00 scheduled job for users with autopay enabled.
- `AutopayScheduler.processAutopaymentsForUser`: manual/user-scoped autopay processor, including an `asOfDate` overload for testing date-based execution.

## Known Risks And Deployment Notes

- Replace all demo secrets in `.env` before production.
- Use a real long `JWT_SECRET`; it must be at least 32 characters.
- Keep `DIDIT_API_KEY` server-side only and ensure the Didit account has credits. Rotate the key if it was shared outside secure channels.
- Apply `scripts/db/kyc-security-migration.sql` or let Hibernate update a non-production database before deploying the strict KYC changes. Production should use controlled migrations.
- Add controlled migrations before production instead of relying on Hibernate `ddl-auto=update`.
- Backend tests currently use the configured MySQL URL for the Spring context test. Consider adding an isolated test profile/database.
- The internal wallet table remains backend-only and should not be exposed in mobile UI.
- Review whether `merchants` and `messages` are required by the admin/support roadmap before deleting them.
