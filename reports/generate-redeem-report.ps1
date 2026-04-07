param(
  [string]$OutputDir = "umkm/zeratto/reports"
)

$ErrorActionPreference = "Stop"

function Get-IssuedDateText {
  param([object]$Row)

  $candidates = @($Row.distributedAt, $Row.createdAt, $Row.updatedAt)
  foreach ($value in $candidates) {
    if ($null -eq $value) { continue }

    if ($value -is [int] -or $value -is [long] -or $value -is [double]) {
      try {
        return [DateTimeOffset]::FromUnixTimeMilliseconds([long]$value).ToString("yyyy-MM-dd HH:mm:ss")
      } catch {
        continue
      }
    }

    if ($value -is [string]) {
      $parsed = [DateTimeOffset]::MinValue
      if ([DateTimeOffset]::TryParse($value, [ref]$parsed)) {
        return $parsed.ToString("yyyy-MM-dd HH:mm:ss")
      }
    }
  }

  return "-"
}

$uri = "https://login-fe9bf-default-rtdb.firebaseio.com/zerattoRedeemCodes.json"
$data = Invoke-RestMethod -Uri $uri -Method Get

if (-not $data) {
  throw "Data kode redeem kosong atau gagal diambil dari Firebase."
}

$rows = @()
$totalOut = 0

foreach ($property in $data.PSObject.Properties) {
  $key = [string]$property.Name
  $row = $property.Value
  if (-not $row) { $row = @{} }

  $code = if ($row.code) { [string]$row.code } else { $key }
  $usedBy = if ($row.usedBy) { [string]$row.usedBy } else { "" }
  $isOut = -not [string]::IsNullOrWhiteSpace($usedBy)
  if ($isOut) { $totalOut += 1 }

  $rows += [PSCustomObject]@{
    "Kode Redeem"   = $code
    "Status In"     = "☑"
    "Status Out"    = $(if ($isOut) { "✅" } else { "" })
    "Tanggal Terbit" = (Get-IssuedDateText -Row $row)
  }
}

$rows = $rows | Sort-Object "Kode Redeem"
$total = $rows.Count
$totalIn = $total

if (-not (Test-Path $OutputDir)) {
  New-Item -Path $OutputDir -ItemType Directory | Out-Null
}

$stamp = (Get-Date).ToString("yyyyMMdd_HHmmss")
$csvPath = Join-Path $OutputDir ("kode-redeem-status-" + $stamp + ".csv")
$summaryPath = Join-Path $OutputDir ("kode-redeem-summary-" + $stamp + ".txt")
$latestCsvPath = Join-Path $OutputDir "kode-redeem-status-terbaru.csv"
$latestSummaryPath = Join-Path $OutputDir "kode-redeem-summary-terbaru.txt"

$rows | Export-Csv -Path $csvPath -NoTypeInformation -Encoding UTF8

$summaryText = @"
Tanggal/Bulan/Tahun Terbit: $((Get-Date).ToString("dd/MM/yyyy"))
Kode Redeem (total): $total
Status In (total): $totalIn
Status Out (total): $totalOut
"@

Set-Content -Path $summaryPath -Value $summaryText -Encoding UTF8
Copy-Item -Path $csvPath -Destination $latestCsvPath -Force
Copy-Item -Path $summaryPath -Destination $latestSummaryPath -Force

Write-Output ("CSV: " + $csvPath)
Write-Output ("SUMMARY: " + $summaryPath)
Write-Output ("LATEST_CSV: " + $latestCsvPath)
Write-Output ("LATEST_SUMMARY: " + $latestSummaryPath)
Write-Output ("TOTAL: $total | IN: $totalIn | OUT: $totalOut")
