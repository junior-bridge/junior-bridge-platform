param(
    [ValidateSet('Prepare', 'Up', 'Test', 'Stop')][string]$Action = 'Test',
    [string]$RuntimeDir = (Join-Path $env:TEMP 'juniorbridge-e2e-ezequiel'),
    [int]$FrontendPort = 3107,
    [int]$BackendPort = 8107,
    [int]$RepeatEach = 1,
    [switch]$Headed,
    [switch]$List,
    [switch]$All,
    [string]$Spec = '',
    [string]$ReaderPython = 'python'
)
$ErrorActionPreference = 'Stop'
$frontend = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$playwrightCli = Join-Path $frontend 'node_modules/@playwright/test/cli.js'
$repo = (Resolve-Path (Join-Path $frontend '..')).Path
$runtime = [IO.Path]::GetFullPath($RuntimeDir)
if ($runtime.StartsWith($repo + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase) -or $runtime -eq $repo) {
    throw 'RuntimeDir debe estar fuera del repositorio (contiene credenciales locales).'
}
$stack = 'juniorbridge-e2e-ezequiel'
$compose = Join-Path $PSScriptRoot 'compose.e2e.yml'
$envFile = Join-Path $runtime 'stack.env'
$runtimeFile = Join-Path $runtime 'runtime.json'
if ($Action -eq 'Prepare') {
    New-Item -ItemType Directory -Force -Path $runtime | Out-Null
    if (!(Test-Path $runtimeFile)) {
        # Compatible con Windows PowerShell 5.1 (sin ToHexString/GetBytes estático).
        function New-LocalSecret {
            $bytes = New-Object byte[] 24
            $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
            try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
            return -join ($bytes | ForEach-Object { $_.ToString('x2') })
        }
        @{
            stack = $stack; baseURL = "http://127.0.0.1:$FrontendPort";
            apiURL = "http://127.0.0.1:$BackendPort"; composeFile = $compose;
            envFile = $envFile; password = (New-LocalSecret); readerPython = $ReaderPython;
            evidenceDir = (Join-Path $runtime 'evidence')
        } | ConvertTo-Json | Set-Content -Encoding UTF8 -LiteralPath $runtimeFile
        @(
            "E2E_STACK=$stack", "E2E_FRONTEND_PORT=$FrontendPort", "E2E_BACKEND_PORT=$BackendPort",
            "E2E_DB_PASSWORD=$(New-LocalSecret)", "E2E_SECRET_KEY=$(New-LocalSecret)"
        ) | Set-Content -Encoding ASCII -LiteralPath $envFile
    }
    $state = Get-Content -Raw -LiteralPath $runtimeFile | ConvertFrom-Json
    if ($PSBoundParameters.ContainsKey('ReaderPython')) {
        $state.readerPython = $ReaderPython
        $state | ConvertTo-Json | Set-Content -Encoding UTF8 -LiteralPath $runtimeFile
    }
    Write-Output "Runtime local preparado: $runtime"
    exit 0
}
if (!(Test-Path $runtimeFile)) { throw 'Ejecutá primero -Action Prepare.' }
$state = Get-Content -Raw -LiteralPath $runtimeFile | ConvertFrom-Json
if ($state.stack -ne $stack) { throw 'Identidad de stack incorrecta.' }
$composeArgs = @('compose', '--project-name', $stack, '--env-file', $envFile, '-f', $compose)
if ($Action -eq 'Up') {
    foreach ($url in @($state.baseURL, $state.apiURL)) {
        $port = ([Uri]$url).Port
        if (Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue) {
            throw "Puerto $port ocupado. Verificá el propietario; no reutilizar un Next ajeno."
        }
    }
    & docker @composeArgs up -d --build --wait --wait-timeout 300
    exit $LASTEXITCODE
}
if ($Action -eq 'Stop') {
    & docker @composeArgs stop
    exit $LASTEXITCODE
}
$env:E2E_RUNTIME_FILE = $runtimeFile
if (!(Test-Path -LiteralPath $playwrightCli)) { throw 'Instalá las dependencias oficiales con npm ci --prefix frontend.' }
$env:E2E_RESULTS_DIR = Join-Path $state.evidenceDir ((Get-Date -Format 'yyyyMMdd-HHmmss') + '-' + [Guid]::NewGuid().ToString('N').Substring(0, 6))
$pwArgs = @('--project', 'chromium', '--repeat-each', $RepeatEach)
if ($Headed) { $pwArgs += '--headed' }
if ($List) { $pwArgs += '--list' }
if ($Spec) { $pwArgs += $Spec }
elseif (!$All) {
    $pwArgs += @('e2e/tests/report-creation.spec.ts', 'e2e/tests/report-export.spec.ts', 'e2e/tests/project-rating.spec.ts')
}
Push-Location $frontend
try {
    & npm run test:e2e -- @pwArgs
    exit $LASTEXITCODE
} finally { Pop-Location }
