param(
  [string]$EnvFile = "D:\CODEX\brokerlens\.env.local",
  [string]$NarrationFile = (Join-Path $PSScriptRoot "demo-narration.txt"),
  [string]$OutputFile = (Join-Path $PSScriptRoot "resequence-demo-narration.mp3")
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $EnvFile)) {
  throw "Could not find the environment file at $EnvFile"
}

if (-not (Test-Path -LiteralPath $NarrationFile)) {
  throw "Could not find the narration at $NarrationFile"
}

$keyLine = Get-Content -LiteralPath $EnvFile |
  Where-Object { $_ -match '^\s*OPENAI_API_KEY\s*=' } |
  Select-Object -First 1

if (-not $keyLine) {
  throw "OPENAI_API_KEY was not found in $EnvFile"
}

$apiKey = $keyLine.Substring($keyLine.IndexOf("=") + 1).Trim().Trim('"').Trim("'")
if (-not $apiKey) {
  throw "OPENAI_API_KEY is empty in $EnvFile"
}

$narration = (Get-Content -Raw -LiteralPath $NarrationFile).Trim()
$requestBody = @{
  model = "tts-1-hd"
  voice = "echo"
  input = $narration
  response_format = "mp3"
  speed = 1.0
} | ConvertTo-Json -Depth 3

Invoke-WebRequest `
  -Uri "https://api.openai.com/v1/audio/speech" `
  -Method Post `
  -Headers @{ Authorization = "Bearer $apiKey" } `
  -ContentType "application/json" `
  -Body $requestBody `
  -OutFile $OutputFile

Write-Host "Created audio: $OutputFile"
