$buildDate = (Get-Date).ToUniversalTime().ToString("o")

# Convert scripts to Unix line endings (LF) before building
$scripts = @(
    ".\src\AI.Receipts\entrypoint.sh"
)

foreach ($scriptPath in $scripts) {
    if (Test-Path $scriptPath) {
        $content = Get-Content $scriptPath -Raw
        $content = $content -replace "`r`n", "`n"
        [System.IO.File]::WriteAllText((Resolve-Path $scriptPath), $content)
        Write-Host "Converted $scriptPath to Unix line endings"
    }
}

docker compose build --build-arg BUILD_DATE=$buildDate
docker compose create ai.receipts
docker compose start ai.receipts
