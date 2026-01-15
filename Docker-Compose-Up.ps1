$buildDate = (Get-Date).ToUniversalTime().ToString("o")

docker compose build --build-arg BUILD_DATE=$buildDate
docker compose create ai_receipts
docker compose start ai_receipts
