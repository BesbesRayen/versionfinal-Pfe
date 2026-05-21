$ErrorActionPreference = "Stop"

$email = "codex-autopay-$(Get-Date -Format yyyyMMddHHmmss)@example.com"
$password = "Password123"

$registerBody = @{
    firstName = "Codex"
    lastName = "Autopay"
    email = $email
    password = $password
    phone = "20000000"
} | ConvertTo-Json

Invoke-RestMethod `
    -Method Post `
    -Uri "http://localhost:8082/api/auth/register" `
    -ContentType "application/json" `
    -Body $registerBody | Out-Null

docker compose exec -T db mysql -ucreaditn -pcreaditnpass creaditn -e @"
UPDATE users
SET email_verified=b'1',
    email_verification_otp=NULL,
    email_verification_otp_expiry=NULL,
    kyc_status='APPROVED',
    monthly_salary=2500,
    autopay=b'1',
    payment_score_modifier=0
WHERE email='$email';
"@ | Out-Null

$loginBody = @{
    email = $email
    password = $password
} | ConvertTo-Json

$login = Invoke-RestMethod `
    -Method Post `
    -Uri "http://localhost:8082/api/auth/login" `
    -ContentType "application/json" `
    -Body $loginBody

$userId = [int]$login.userId
$headers = @{ Authorization = "Bearer $($login.token)" }

$setupSql = @"
INSERT INTO user_wallet (user_id, balance, created_at, updated_at)
VALUES ($userId, 500.00, NOW(), NOW())
ON DUPLICATE KEY UPDATE balance=500.00, updated_at=NOW();

INSERT INTO credit_requests (
    created_at,
    down_payment,
    monthly_amount,
    number_of_installments,
    product_name,
    status,
    total_amount,
    user_id,
    financed_amount,
    interest_amount,
    interest_rate,
    total_payable
) VALUES (
    NOW(),
    100.00,
    133.33,
    3,
    'Autopay Live Test',
    'APPROVED',
    500.00,
    $userId,
    400.00,
    0.00,
    0.0000,
    400.00
);

SET @credit_id = LAST_INSERT_ID();

INSERT INTO installments (amount, due_date, paid_date, penalty, status, credit_request_id)
VALUES
    (125.00, CURDATE(), NULL, 5.00, 'PENDING', @credit_id),
    (133.33, DATE_ADD(CURDATE(), INTERVAL 1 MONTH), NULL, 0.00, 'PENDING', @credit_id);

SELECT @credit_id, LAST_INSERT_ID();
"@

$ids = docker compose exec -T db mysql -ucreaditn -pcreaditnpass creaditn -N -B -e $setupSql
$parts = (($ids | Select-Object -Last 1) -split "`t")
$creditId = [int]$parts[0]
$firstInstallmentId = [int]$parts[1]

$before = docker compose exec -T db mysql -ucreaditn -pcreaditnpass creaditn -N -B -e @"
SELECT balance FROM user_wallet WHERE user_id=$userId;
SELECT id,status,amount,penalty,due_date FROM installments WHERE credit_request_id=$creditId ORDER BY id;
"@

$result = Invoke-RestMethod `
    -Method Post `
    -Uri "http://localhost:8082/api/payments/autopay/process-due?userId=$userId" `
    -Headers $headers

$after = docker compose exec -T db mysql -ucreaditn -pcreaditnpass creaditn -N -B -e @"
SELECT balance FROM user_wallet WHERE user_id=$userId;
SELECT id,status,amount,penalty,paid_date FROM installments WHERE credit_request_id=$creditId ORDER BY id;
SELECT amount,type,status,reference,description FROM transactions WHERE user_id=$userId ORDER BY id DESC LIMIT 1;
SELECT title,type FROM notifications WHERE user_id=$userId ORDER BY id DESC LIMIT 1;
"@

[pscustomobject]@{
    email = $email
    userId = $userId
    creditId = $creditId
    firstInstallmentId = $firstInstallmentId
    apiMessage = $result.message
    paidInstallments = $result.data.paidInstallments
    before = $before
    after = $after
} | ConvertTo-Json -Depth 6
