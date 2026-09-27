$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:8080/")
$listener.Prefixes.Add("http://127.0.0.1:8080/")
$listener.Start()
Write-Host "======================================================="
Write-Host " GateSync Web Server is LIVE at: http://localhost:8080/"
Write-Host "======================================================="

$staticDir = Join-Path $PSScriptRoot "src\main\resources\static"

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        try {
            $req = $context.Request
            $res = $context.Response

            $path = $req.Url.LocalPath
            if ($path -eq "/" -or $path -eq "") {
                $path = "/index.html"
            }

            $fullPath = Join-Path $staticDir ($path.Replace('/', '\').TrimStart('\'))

            [byte[]]$bytes = @()
            if ($path -eq "/api/health") {
                $json = '{"status":"OK","message":"Your API is running","timestamp":"' + (Get-Date -Format "o") + '"}'
                $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
                $res.ContentType = "application/json; charset=utf-8"
            } else {
                $targetFile = $null
                if (Test-Path $fullPath -PathType Leaf) {
                    $targetFile = $fullPath
                } else {
                    $rootPath = Join-Path $PSScriptRoot ($path.Replace('/', '\').TrimStart('\'))
                    if (Test-Path $rootPath -PathType Leaf) {
                        $targetFile = $rootPath
                    }
                }

                if ($targetFile) {
                    $bytes = [System.IO.File]::ReadAllBytes($targetFile)
                    if ($targetFile.EndsWith(".html")) { $res.ContentType = "text/html; charset=utf-8" }
                    elseif ($targetFile.EndsWith(".css")) { $res.ContentType = "text/css" }
                    elseif ($targetFile.EndsWith(".js")) { $res.ContentType = "application/javascript" }
                    elseif ($targetFile.EndsWith(".json")) { $res.ContentType = "application/json" }
                    elseif ($targetFile.EndsWith(".png")) { $res.ContentType = "image/png" }
                    elseif ($targetFile.EndsWith(".jpg") -or $targetFile.EndsWith(".jpeg")) { $res.ContentType = "image/jpeg" }
                    elseif ($targetFile.EndsWith(".svg")) { $res.ContentType = "image/svg+xml" }
                    elseif ($targetFile.EndsWith(".ico")) { $res.ContentType = "image/x-icon" }
                } else {
                    $res.StatusCode = 404
                    $bytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
                }
            }
            
            $res.ContentLength64 = $bytes.Length
            $res.OutputStream.Write($bytes, 0, $bytes.Length)
            $res.OutputStream.Close()
        } catch {
            # Catch per-request exceptions so loop continues
        }
    }
} finally {
    $listener.Stop()
}
