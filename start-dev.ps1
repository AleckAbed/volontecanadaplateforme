# Script pour démarrer le serveur de développement
$env:NEXT_PUBLIC_API_URL="http://localhost:8000/api"
$env:NEXTAUTH_URL="http://localhost:3001"
$env:NEXTAUTH_SECRET="dev-secret"
$env:NODE_ENV="development"

Write-Host "Démarrage du serveur Next.js..." -ForegroundColor Green
Write-Host "Port: 3001" -ForegroundColor Yellow
Write-Host "API URL: $env:NEXT_PUBLIC_API_URL" -ForegroundColor Yellow

cd apps\isomorphic
pnpm dev

