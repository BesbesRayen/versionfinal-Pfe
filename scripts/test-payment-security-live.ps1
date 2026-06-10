$ErrorActionPreference = "Stop"

$email = "codex-audit-$(Get-Date -Format yyyyMMddHHmmss)@example.com"
$password = "AuditPassword123!"
$registerBody = @{
    firstName = "Audit"
    lastName = "Payment"
    email = $email
    password = $password
    phone = "20000000"
} | ConvertTo-Json

Invoke-RestMethod `
    -Method Post `
    -Uri "http://localhost:8082/api/auth/register" `
    -ContentType "application/json" `
    -Body $registerBody | Out-Null

docker compose exec db mysql -ucreaditn -pcreaditnpass creaditn -e `
    "UPDATE users SET email_verified=b'1', kyc_status='APPROVED', kyc_submitted_at=NOW() WHERE email='$email';" | Out-Null

$loginBody = @{ email = $email; password = $password } | ConvertTo-Json
$login = Invoke-RestMethod `
    -Method Post `
    -Uri "http://localhost:8082/api/auth/login" `
    -ContentType "application/json" `
    -Body $loginBody
$headers = @{ Authorization = "Bearer $($login.token)" }

$crossAccountStatus = 0
try {
    Invoke-WebRequest `
        -UseBasicParsing `
        -Uri "http://localhost:8082/api/users/profile?userId=$($login.userId + 1)" `
        -Headers $headers | Out-Null
    $crossAccountStatus = 200
} catch {
    $crossAccountStatus = [int]$_.Exception.Response.StatusCode
}

$cardBody = @{
    cardNumber = "4111111111111111"
    expiryDate = "12/30"
    cardholderName = "AUDIT PAYMENT"
    type = "VISA"
    cvv = "123"
    defaultCard = $true
} | ConvertTo-Json
Invoke-RestMethod `
    -Method Post `
    -Uri "http://localhost:8082/api/cards/add?userId=$($login.userId)" `
    -ContentType "application/json" `
    -Headers $headers `
    -Body $cardBody | Out-Null

$profileBody = @{
    monthlySalary = 3000
    salaryDay = 25
    employmentStatus = "FULL_TIME"
} | ConvertTo-Json
Invoke-RestMethod `
    -Method Post `
    -Uri "http://localhost:8082/api/profile/create?userId=$($login.userId)" `
    -ContentType "application/json" `
    -Headers $headers `
    -Body $profileBody | Out-Null

$checkoutBody = @{
    articleId = 13
    paymentType = "CREDIT"
    installmentMonths = 3
} | ConvertTo-Json
$order = Invoke-RestMethod `
    -Method Post `
    -Uri "http://localhost:8082/api/purchases/checkout?userId=$($login.userId)" `
    -ContentType "application/json" `
    -Headers $headers `
    -Body $checkoutBody

$installments = Invoke-RestMethod `
    -Method Get `
    -Uri "http://localhost:8082/api/credits/my-installments?userId=$($login.userId)" `
    -Headers $headers
$installment = $installments | Where-Object { $_.status -ne "PAID" } | Select-Object -First 1

docker compose exec db mysql -ucreaditn -pcreaditnpass creaditn -e `
    "UPDATE user_wallet SET balance=0.00 WHERE user_id=$($login.userId);" | Out-Null

$payBody = @{
    installmentId = $installment.id
    amount = ([decimal]$installment.amount + [decimal]$installment.penalty)
    paymentMethod = "CARD"
    password = $password
} | ConvertTo-Json

$zeroBalanceStatus = 0
$zeroBalanceMessage = ""
try {
    Invoke-RestMethod `
        -Method Post `
        -Uri "http://localhost:8082/api/payments/installments/$($installment.id)/pay?userId=$($login.userId)" `
        -ContentType "application/json" `
        -Headers $headers `
        -Body $payBody | Out-Null
    $zeroBalanceStatus = 200
} catch {
    $zeroBalanceStatus = [int]$_.Exception.Response.StatusCode
    $zeroBalanceMessage = $_.ErrorDetails.Message
}

$result = [pscustomobject]@{
    userId = $login.userId
    crossAccountStatus = $crossAccountStatus
    orderId = $order.id
    installmentId = $installment.id
    zeroBalancePaymentStatus = $zeroBalanceStatus
    zeroBalanceRejected = $zeroBalanceStatus -ge 400
    zeroBalanceMessage = $zeroBalanceMessage
}

$env:TEST_SOCKET_TOKEN = $login.token
$env:TEST_SOCKET_USER_ID = "$($login.userId)"
$socketSecretLine = Get-Content ".env" | Where-Object { $_ -match "^SOCKET_EMIT_SECRET=" } | Select-Object -First 1
$env:TEST_SOCKET_EMIT_SECRET = ($socketSecretLine -split "=", 2)[1]
$socketResult = node scripts/test-socket-live.cjs | ConvertFrom-Json
Remove-Item Env:TEST_SOCKET_TOKEN
Remove-Item Env:TEST_SOCKET_USER_ID
Remove-Item Env:TEST_SOCKET_EMIT_SECRET

[pscustomobject]@{
    payment = $result
    socket = $socketResult
} | ConvertTo-Json -Depth 6
