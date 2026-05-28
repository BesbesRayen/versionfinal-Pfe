# Merchant / Marchant Dependency Analysis

Date: 2026-05-28

## Decision

Do not delete the `merchants` table now.

The misspelled `marchant` / `marchants` table does not exist in the live Docker database and no code-backed table/model was found for it. The correctly named `merchants` table exists and is still wired into backend APIs and rewards logic. It has no live rows and no foreign keys, but it is not completely unused.

## Live Database Findings

Database checked from the running Docker MySQL service `creaditn-db`, schema `creaditn`.

| Check | Result |
| --- | --- |
| Table `merchant` | Does not exist |
| Table `marchant` | Does not exist |
| Table `merchants` | Exists |
| `SELECT COUNT(*) FROM merchants` | `0` rows |
| Foreign keys referencing `merchant`, `marchant`, or `merchants` | None |
| Foreign keys declared by `merchants` | None |
| Purchase orders with merchant payout data | `3` live rows |
| Invoices with merchant amount fields | `3` live rows |

Live table shape:

```sql
CREATE TABLE `merchants` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `active` bit(1) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `category` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `logo_url` varchar(255) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `phone` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
);
```

## Code Usage Found

Backend entity/model:

- `creadiTn/src/main/java/com/creaditn/creaditnbackend/entity/Merchant.java`
  - JPA entity mapped with `@Table(name = "merchants")`.

Backend repository:

- `creadiTn/src/main/java/com/creaditn/creaditnbackend/repository/MerchantRepository.java`
  - Extends `JpaRepository<Merchant, Long>`.
  - Provides `findByActiveTrue()` and `findByCategory(String category)`.

Backend API/controller:

- `creadiTn/src/main/java/com/creaditn/creaditnbackend/controller/MerchantController.java`
  - `GET /api/merchants`
  - `GET /api/merchants/category/{category}`
  - `GET /api/merchants/{id}`

Backend rewards logic:

- `creadiTn/src/main/java/com/creaditn/creaditnbackend/service/RewardsService.java`
  - Injects `MerchantRepository`.
  - Reads active merchants to build cashback offers.
  - Has a fallback offer only when the table has no active merchants.

Database reset paths:

- `creadiTn/src/main/java/com/creaditn/creaditnbackend/service/DevDatabaseResetService.java`
  - Includes `merchants` in reset table list.
- `scripts/db/reset-mysql.sql`
  - Deletes and resets identity for `merchants`.
- `scripts/db/reset-postgresql.sql`
  - Includes `merchants` in reset list.

Docker/database initialization:

- `docker-compose.yml`
  - Mounts `scripts/db/initial-data.sql` into MySQL initialization.
- `scripts/db/initial-data.sql`
  - Creates `merchants`.
  - Adds primary key and auto-increment.
  - Does not seed merchant rows.

Frontend/mobile:

- `frontend mobile/src/lib/api.ts`
  - Defines `Merchant`.
  - Exposes `getMerchants()` calling `/api/merchants`.
- Current mobile shop screens use the newer store/catalog flow (`getShopCatalogShops`) while still passing route params named `merchantId` / `merchantName`.
- `frontend mobile/README.md` still documents Shops as `/api/merchants`, which is outdated relative to current screen code.

Documentation:

- `docs/audit/STEP2_DATABASE_AUDIT.md`
  - Already records `merchants` as used and recommends keeping it.
- `docs/ARCHITECTURE.md`
  - Warns not to drop `merchants` without confirming dashboard/support requirements.
- `PROJECT_DOCUMENTATION.md`, `creadiTn/API_TESTING_GUIDE.md`, and `creadiTn/LEARNING_GUIDE_FR.md`
  - Document merchant APIs and merchant concepts.

## Payment / Transaction / KYC / Wallet / Auth Impact

No direct foreign key links were found from payment, transaction, card, KYC, wallet, or user tables into `merchants`.

However, merchant-related payout fields are active in purchase and invoice systems:

- `purchase_orders.merchant_paid`
- `purchase_orders.merchant_paid_at`
- `purchase_orders.merchant_payout_reference`
- `purchase_orders.merchant_margin_rate`
- `purchase_orders.merchant_payout_amount`
- `invoices.merchant_margin_rate`
- `invoices.merchant_payout_amount`

These fields do not reference `merchants.id`, but they are part of the merchant/partner payout model. Dropping `merchants` while retaining these fields would leave the codebase with a split merchant concept and broken rewards/merchant APIs.

## Hidden / Migration / Seed Dependencies

- There are no Flyway/Liquibase migrations in this project.
- Main SQL seed/init file still creates `merchants`.
- Reset scripts and the dev reset service still know about `merchants`.
- Merchant API docs exist and would become incorrect if the controller/table were removed.
- `RewardsService` would need a replacement data source before `MerchantRepository` could be removed.

## Risk Of Deletion

Deletion risk is medium, not safe.

Expected breakages if only the table is dropped:

- Backend startup can fail because Hibernate validates/uses the `Merchant` entity table.
- `/api/merchants` endpoints break.
- `/api/rewards/offers` breaks because `RewardsService` queries `MerchantRepository`.
- Dev reset scripts/services reference a missing table unless guarded everywhere.
- Existing documentation/API tests become incorrect.

Expected effort if merchant removal is later approved:

- Replace or remove `MerchantController`, `MerchantRepository`, `MerchantDto`, and `Merchant`.
- Rewrite `RewardsService.getOffers()` to use stores/articles or static offers.
- Update mobile API helpers and documentation.
- Remove `merchants` from reset scripts and initial SQL.
- Add a migration/drop script only after a database backup.
- Re-test backend startup, rewards, checkout, payment, invoices, transactions, auth, KYC, wallet, Docker startup, and frontend/mobile builds.

## Recommended Action

Keep `merchants` for now.

Do not mark it deprecated yet because there is still real backend usage. If the newer `stores` model is intended to replace merchants, first migrate `RewardsService` and `/api/merchants` consumers to `stores`, update docs/mobile API helpers, and only then prepare a backup plus controlled drop migration.

