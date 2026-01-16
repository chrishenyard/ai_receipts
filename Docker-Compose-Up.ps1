$buildDate = (Get-Date).ToUniversalTime().ToString("o")

# Convert init-db.sh to Unix line endings (LF) before building
$initDbPath = ".\src\AI.Receipts\init-db.sh"
if (Test-Path $initDbPath) {
    $content = Get-Content $initDbPath -Raw
    $content = $content -replace "`r`n", "`n"
    [System.IO.File]::WriteAllText((Resolve-Path $initDbPath), $content)
    Write-Host "Converted init-db.sh to Unix line endings"
}

docker compose build --build-arg BUILD_DATE=$buildDate
docker compose create ai.receipts
docker compose start ai.receipts
