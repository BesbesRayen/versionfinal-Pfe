param(
  [ValidateSet("lan", "tunnel", "offline")]
  [string]$Mode = "lan"
)

$privateIpPattern = '^(192\.168|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)'
$excludedAdapterPattern = 'vEthernet|Docker|WSL|Hyper-V|Loopback|Bluetooth|Tailscale|ZeroTier|VMware|VirtualBox|Npcap'

$adapters = Get-NetAdapter |
  Where-Object {
    $_.Status -eq "Up" -and
    $_.Name -notmatch $excludedAdapterPattern -and
    $_.InterfaceDescription -notmatch $excludedAdapterPattern
  }

$candidates = foreach ($adapter in $adapters) {
  Get-NetIPAddress -AddressFamily IPv4 -InterfaceIndex $adapter.ifIndex -ErrorAction SilentlyContinue |
    Where-Object {
      $_.IPAddress -match $privateIpPattern -and
      $_.IPAddress -notmatch '^169\.254\.'
    } |
    ForEach-Object {
      [pscustomobject]@{
        IPAddress = $_.IPAddress
        InterfaceAlias = $_.InterfaceAlias
        InterfaceMetric = $_.InterfaceMetric
        Priority = if ($adapter.Name -match 'Wi-Fi|Wireless|WLAN' -or $adapter.InterfaceDescription -match 'Wi-Fi|Wireless|WLAN') { 0 } else { 1 }
      }
    }
}

$selected = $candidates |
  Sort-Object -Property Priority, InterfaceMetric |
  Select-Object -First 1

$ip = $selected.IPAddress

if (-not $ip) {
  throw "No reachable private LAN IP found. Connect to Wi-Fi and retry."
}

function Test-PortFree {
  param([int]$Port)
  $tcp = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
  return $null -eq $tcp
}

$port = 8090
while ($port -le 8099 -and -not (Test-PortFree -Port $port)) {
  $port++
}

if ($port -gt 8099) {
  throw "No free Expo port found between 8085 and 8099."
}

$env:REACT_NATIVE_PACKAGER_HOSTNAME = $ip
$env:EXPO_PUBLIC_API_BASE_URL = "http://${ip}:8082"
$env:EXPO_PUBLIC_SOCKET_URL = "http://${ip}:3001"

Write-Host "Expo mode: $Mode"
Write-Host "Expo port: $port"
Write-Host "Network adapter: $($selected.InterfaceAlias)"
Write-Host "Backend API: $env:EXPO_PUBLIC_API_BASE_URL"
Write-Host "Phone backend test URL: http://${ip}:8082/api/users/health"

if ($Mode -eq "tunnel") {
  npx expo start --tunnel --port $port --clear
} elseif ($Mode -eq "offline") {
  npx expo start --offline --port $port --clear
} else {
  npx expo start --lan --port $port --clear
}
