# STEP 2 - Database Audit

Status: completed as an audit/proposal only. No live database migration was applied.

Sources checked:
- Live MySQL database in Docker: `creaditn`
- Root SQL dump: `creaditn (2).sql`
- Backend SQL resources: `creadiTn/src/main/resources/schema.sql`, `schema-bnpl.sql`
- Spring JPA entities and repositories
- Next.js direct SQL routes
- Reset/migration scripts under `scripts/db`

## Live Schema Summary

Live database contains 18 tables:

`admin_notifications`, `articles`, `cards`, `creadi_scores`, `credit_requests`, `financial_profiles`, `installments`, `invoices`, `kyc_audit_logs`, `kyc_documents`, `merchants`, `messages`, `notifications`, `payments`, `purchase_orders`, `transactions`, `user_wallet`, `users`.

The live table set matches the root dump `creaditn (2).sql`. It does not match the older backend `schema.sql`, which still defines obsolete `credits` and `verification_tokens` tables.

## Table Audit

| Table | Stores | Code usage | Status / flags | Recommended action |
|---|---|---|---|---|
| `admin_notifications` | Admin-facing alerts for credit purchases and invoice generation. | `AdminNotification` entity, repository, service, admin controller/pages. | Used. `order_id` is a loose bigint without FK. | Keep. Add FK from `order_id` to `purchase_orders(id)` if old data is valid. |
| `articles` | Product catalog shown in shopping flows and dashboard product reel. | `Article` entity/repository/service/controller; mobile and dashboard shop flows. | Used. | Keep. Add query indexes for active/category if needed. |
| `cards` | User payment cards, encrypted card number, last4, status/default flag. | `Card` entity/repository/service/controller; mobile Cards flow. | Used. | Keep. Current schema links to `users`. |
| `creadi_scores` | Historical CreadiScore calculations per user. | `CreadiScore` entity/repository/service/controller; score dashboard. | Used. History table, not duplicate. | Keep. |
| `credit_requests` | BNPL credit applications and computed repayment fields. | `CreditRequest` entity/repository/service/controller; admin credits; mobile credit flow. | Used. Replaces obsolete `credits` table from old schema. | Keep. Remove stale `credits` references from reset scripts/schema docs later. |
| `financial_profiles` | User salary day, employment status, monthly salary, derived risk level. | `FinancialProfile` entity/repository/service/controller. | Used. `users.monthly_salary` duplicates salary and is kept in sync for legacy scoring. | Keep. Later refactor CreadiScore to read this table directly, then remove duplicate user salary. |
| `installments` | Generated repayment schedule for each credit request. | `Installment` entity/repository/service/schedulers/payments. | Used. | Keep. Add index on status/due date for scheduler queries. |
| `invoices` | Immutable invoice snapshots linked to purchase orders and users. | `Invoice` entity/repository/service/admin invoice controller. | Used. | Keep. |
| `kyc_audit_logs` | Manual/admin KYC decision history with previous and new status. | `KycAuditLog` entity/repository/KYC service. | Used. | Keep. Add index by document/date if audit grows. |
| `kyc_documents` | Uploaded KYC document URLs, hashes, provider identity data, scores, fraud signals, status. | `KycDocument` entity/repository/KYC service/controller. | Used, but contains several unmodeled legacy columns not present in the current JPA entity. | Keep table. Drop only unmapped legacy columns after backup and code confirmation. |
| `merchants` | Merchant partner records for merchant/rewards endpoints. | `Merchant` entity/repository/controller/rewards service. | Used in code but currently 0 rows. | Keep. Seed or import real merchants later. |
| `messages` | Public contact-form submissions for admin messages page. | Next.js `api/contact`, `api/messages`, `admin/messages`. | Used, but bypasses Spring backend and name is generic. No JPA entity. | Keep for now. Clean target: rename to `contact_messages` and move access behind backend service. |
| `notifications` | User-facing app notifications. | `Notification` entity/repository/service/controller; mobile notifications. | Used. | Keep. Add composite user/read/date index. |
| `payments` | Payment records against installments and users. | `Payment` entity/repository/service/controller/receipt/rewards. | Used. | Keep. |
| `purchase_orders` | Checkout orders for cash and credit purchases, article snapshot, merchant payout fields. | `PurchaseOrder` entity/repository/service/admin purchase flow. | Used. | Keep. |
| `transactions` | User transaction ledger entries and wallet/payment references. | `Transaction` entity/repository/service/controller. | Used. `user_id` is not a DB FK. | Keep. Add FK to `users(id)` after validating rows. |
| `user_wallet` | One wallet balance per user. | `UserWallet` entity/repository/auth/card/payment/autopay services. | Used. Name is singular while other tables are plural; `user_id` is unique but has no FK. | Keep now. Clean target: rename to `user_wallets` and add FK. |
| `users` | Registered users, auth fields, profile basics, KYC state, email verification state. | `User` entity/repository/auth/user/KYC/credit/payment services. | Used. Contains orphan live columns not mapped in `User`: `birth_date`, `gender`, `kyc_verified`, `kyc_verified_at`. Also has legacy score/profile fields. | Keep. Drop unmapped orphan columns after backup. Defer profile-column cleanup until score logic is refactored. |

## Unused / Obsolete Schema Artifacts

These are not live tables in the MySQL database:

- `verification_tokens`: exists only in old `creadiTn/src/main/resources/schema.sql` and reset scripts. Current email verification uses OTP columns on `users`.
- `credits`: exists only in old `schema.sql` and reset scripts. Current credit model is `credit_requests`.

Recommendation: remove these from reset scripts and mark `schema.sql` as obsolete or replace it with a generated current schema after Step 3/4.

## Duplicate / Redundant / Poorly Named Items

- `messages` is too generic. Proposed final name: `contact_messages`.
- `user_wallet` is singular while the rest of the schema is plural. Proposed final name: `user_wallets`.
- `users.monthly_salary` duplicates `financial_profiles.monthly_salary`. It is currently used by `CreadiScoreService`, so do not drop until that service reads `FinancialProfile`.
- `users.birth_date`, `users.gender`, `users.kyc_verified`, `users.kyc_verified_at` are present in DB but not mapped in the current `User` entity and not referenced in backend code.
- Several `kyc_documents` live columns are not mapped or referenced by current backend code: `birth_date_matched`, `cin_matched`, `document_confidence`, `document_face_match_score`, `document_valid`, `extracted_birth_date`, `extracted_cin`, `extracted_gender`, `face_matched`, `first_name_matched`, `gender_matched`, `last_name_matched`, `provider_reference`, `reviewed_at`, `submitted_cin`.

## Clean Final Schema Proposal

Conservative final table set:

1. `users`
2. `user_wallets` currently `user_wallet`
3. `cards`
4. `financial_profiles`
5. `creadi_scores`
6. `kyc_documents`
7. `kyc_audit_logs`
8. `articles`
9. `merchants`
10. `purchase_orders`
11. `credit_requests`
12. `installments`
13. `payments`
14. `transactions`
15. `invoices`
16. `notifications`
17. `admin_notifications`
18. `contact_messages` currently `messages`

No live business table should be deleted immediately. The cleanup is mainly:
- remove obsolete references to `credits` and `verification_tokens`
- add missing foreign keys and indexes
- rename two confusing tables during a coordinated code refactor
- drop orphan columns after backup

## Proposed Migration / Diff

Written to:

`scripts/db/proposed-clean-schema-diff.sql`

It is intentionally split into phases:

- Phase A: safe-ish relational/index improvements that can be applied after checking invalid rows.
- Phase B: table renames that require Java/TypeScript import/query updates.
- Phase C: orphan column drops that require backup and final confirmation.
- Phase D: reset-script/schema-resource cleanup notes, not executable SQL.

## Step 2 Stop Point

Per the requested workflow, this step stops after database audit and migration proposal. No cleanup/refactor/import updates were performed.
