param(
    [switch]$KeepUploads
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$sql = Join-Path $root "scripts\db\reset-mysql.sql"

if (-not (Test-Path $sql)) {
    throw "Missing SQL reset script: $sql"
}

Push-Location $root
try {
    Write-Host "Resetting MySQL application data in docker database 'creaditn'..."
    Get-Content $sql | docker compose exec -T db mysql -ucreaditn -pcreaditnpass creaditn

    if (-not $KeepUploads) {
        Write-Host "Clearing local upload folders..."
        $uploadRoots = @(
            (Join-Path $root "uploads"),
            (Join-Path $root "creadiTn\uploads")
        )
        foreach ($uploadRoot in $uploadRoots) {
            if (Test-Path $uploadRoot) {
                Get-ChildItem -LiteralPath $uploadRoot -Force | Remove-Item -Recurse -Force
            }
        }

        Write-Host "Clearing Docker upload volume through backend container..."
        docker compose exec backend sh -lc "find /app/uploads -mindepth 1 -delete"
    }

    Write-Host "Restarting backend and checking health..."
    docker compose restart backend
    Start-Sleep -Seconds 8
    Invoke-RestMethod -Uri "http://localhost:8082/api/users/health" -Method Get | Out-String | Write-Host

    Write-Host "Development data reset complete. Register a new mobile user to log in."
} finally {
    Pop-Location
}
