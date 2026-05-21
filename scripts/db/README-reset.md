# Development Data Reset

This reset deletes application data while preserving schema, entity mappings, constraints, and environment-based admin configuration.

It removes users, KYC/OCR/face-verification rows, scores, credit requests, BNPL orders, repayments, payments, transactions, notifications, support messages, uploaded files, and transient auth/support caches.

It keeps tables, indexes, foreign keys, migrations/schema files, and application/security configuration.

## Why Login Can Fail

The mobile login endpoint checks `users.email`, the BCrypt password hash, `account_deleted`, and `email_verified`.

`Email ou mot de passe incorrect` usually means the email is not in the database used by the backend, or the password hash does not match. If the account exists but `email_verified = 0`, the backend returns `EMAIL_NOT_VERIFIED`.

## Option A: SQL Only

From the repository root:

```powershell
Get-Content scripts\db\reset-mysql.sql | docker compose exec -T db mysql -ucreaditn -pcreaditnpass creaditn
```

Then clear uploads:

```powershell
Remove-Item -Recurse -Force .\uploads\* -ErrorAction SilentlyContinue
docker compose exec backend sh -lc "find /app/uploads -mindepth 1 -delete"
```

## Option B: PowerShell Helper

From the repository root:

```powershell
.\scripts\reset-dev-data.ps1
```

Use `-KeepUploads` if you only want to clear database rows.

## Option C: Spring Boot Admin Reset Endpoint

The endpoint is disabled by default and requires both an admin token and a reset token.

Enable it only in development:

```env
APP_DEV_RESET_ENABLED=true
APP_DEV_RESET_TOKEN=change-me-local-reset-token
```

Restart the backend, log in to `/api/admin/login`, then call:

```powershell
$admin = Invoke-RestMethod -Method Post -Uri http://localhost:8082/api/admin/login -ContentType "application/json" -Body (@{ email = "admin@bnpl.com"; password = "admin123" } | ConvertTo-Json)
Invoke-RestMethod -Method Post -Uri "http://localhost:8082/api/admin/dev-reset?confirm=RESET_DATABASE&clearUploads=true" -Headers @{ "X-Admin-Token" = $admin.token; "X-Reset-Token" = "change-me-local-reset-token" }
```

After reset, register a new mobile account and verify the email before login.
