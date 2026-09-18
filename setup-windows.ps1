# ============================================================
# setup-windows.ps1
# Configura OpenCode + proyecto Soporte-Telecom en Windows
# Ejecutar: powershell -ExecutionPolicy Bypass -File setup-windows.ps1
# ============================================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Soporte Telecom - Setup Windows" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# --- 1. Verificar Node.js ---
Write-Host "[1/9] Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "  Node.js encontrado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  Node.js no encontrado. Instalando con winget..." -ForegroundColor Red
    winget install OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
    # Recargar PATH
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
    Write-Host "  Node.js instalado: $(node --version)" -ForegroundColor Green
}

# --- 2. Instalar OpenCode ---
Write-Host "[2/9] Instalando OpenCode CLI..." -ForegroundColor Yellow
npm i -g opencode-ai@latest 2>$null
Write-Host "  OpenCode instalado: $(opencode --version)" -ForegroundColor Green

# --- 3. Crear directorio de configuración ---
Write-Host "[3/9] Creando directorio de configuracion..." -ForegroundColor Yellow
$configDir = "$env:APPDATA\opencode"
$skillsDir = "$configDir\skills"
New-Item -ItemType Directory -Path $skillsDir -Force | Out-Null
Write-Host "  Directorio: $configDir" -ForegroundColor Green

# --- 4. Crear opencode.jsonc ---
Write-Host "[4/9] Creando opencode.jsonc..." -ForegroundColor Yellow
$configContent = @'
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "deepseek": {}
  },
  "mcp": {
    "context7": {
      "type": "local",
      "command": ["npx", "-y", "@upstash/context7-mcp"],
      "enabled": true
    },
    "codegraph": {
      "type": "local",
      "command": ["codegraph", "serve", "--mcp"],
      "enabled": true
    }
  }
}
'@
Set-Content -Path "$configDir\opencode.jsonc" -Value $configContent -Encoding UTF8
Write-Host "  Config creada: $configDir\opencode.jsonc" -ForegroundColor Green

# --- 5. Instalar skills ---
Write-Host "[5/9] Instalando skills de OpenCode..." -ForegroundColor Yellow
$skills = @(
    @{ name = "caveman"; repo = "juliusbrussee/caveman" },
    @{ name = "ponytail"; repo = "obra/superpowers/ponytail" },
    @{ name = "using-git-worktrees"; repo = "obra/superpowers/using-git-worktrees" }
)

foreach ($skill in $skills) {
    Write-Host "  Instalando $($skill.name)..." -ForegroundColor Gray
    npx skills add $skill.repo -g $skillsDir 2>$null
}
Write-Host "  3 skills instaladas" -ForegroundColor Green

# --- 6. Clonar proyecto ---
Write-Host "[6/9] Clonando Soporte-Telecom..." -ForegroundColor Yellow
$projectDir = "$HOME\Documents\project\soporte-telecom"
if (Test-Path $projectDir) {
    Write-Host "  Proyecto ya existe en: $projectDir" -ForegroundColor Gray
} else {
    New-Item -ItemType Directory -Path "$HOME\Documents\project" -Force | Out-Null
    git clone https://github.com/jjavdev/Soporte-Telecom.git $projectDir
    Write-Host "  Proyecto clonado: $projectDir" -ForegroundColor Green
}

# --- 7. Instalar dependencias ---
Write-Host "[7/9] Instalando dependencias del proyecto..." -ForegroundColor Yellow
Push-Location $projectDir
npm install
Pop-Location
Write-Host "  Dependencias instaladas" -ForegroundColor Green

# --- 8. Crear .env.local ---
Write-Host "[8/9] Configurando variables de entorno..." -ForegroundColor Yellow
$envLocal = "$projectDir\.env.local"
$envExample = "$projectDir\.env.example"
if (Test-Path $envLocal) {
    Write-Host "  .env.local ya existe" -ForegroundColor Gray
} elseif (Test-Path $envExample) {
    Copy-Item $envExample $envLocal
    Write-Host "  .env.local creado desde .env.example" -ForegroundColor Green
    Write-Host "  EDITAR con tus credenciales de Supabase" -ForegroundColor Red
} else {
    Write-Host "  .env.example no encontrado, saltando" -ForegroundColor Gray
}

# --- 9. Verificar CodeGraph ---
Write-Host "[9/9] Verificando CodeGraph..." -ForegroundColor Yellow
try {
    $cgVersion = codegraph --version 2>$null
    Write-Host "  CodeGraph encontrado: $cgVersion" -ForegroundColor Green
} catch {
    Write-Host "  CodeGraph no encontrado." -ForegroundColor Red
    Write-Host "  Descargar desde: https://github.com/anomalyco/codegraph/releases" -ForegroundColor Yellow
    Write-Host "  Buscar: codegraph-windows-x64.exe" -ForegroundColor Yellow
    Write-Host "  Renombrar a: codegraph.exe y agregar al PATH" -ForegroundColor Yellow
}

# --- Resumen ---
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Setup completado" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Archivos instalados:" -ForegroundColor White
Write-Host "  Config:    $configDir\opencode.jsonc" -ForegroundColor Gray
Write-Host "  Skills:    $skillsDir\" -ForegroundColor Gray
Write-Host "  Proyecto:  $projectDir" -ForegroundColor Gray
Write-Host ""
Write-Host "Pendiente (manual):" -ForegroundColor Yellow
Write-Host "  1. Ejecutar: opencode auth login" -ForegroundColor White
Write-Host "  2. Editar $envLocal con credenciales Supabase" -ForegroundColor White
Write-Host "  3. Instalar Docker Desktop para Windows" -ForegroundColor White
Write-Host "  4. Clonar proyecto y ejecutar: docker compose up -d" -ForegroundColor White
Write-Host "  5. Configurar GEMINI_API_KEY en n8n (Settings > Variables)" -ForegroundColor White
Write-Host "  6. Importar y activar 04-chatbot-nivel1.json en n8n" -ForegroundColor White
Write-Host ""
Write-Host "Para iniciar el proyecto:" -ForegroundColor Yellow
Write-Host "  cd $projectDir" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
