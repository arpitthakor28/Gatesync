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
        $req = $context.Request
        $res = $context.Response

        $path = $req.Url.LocalPath
        if ($path -eq "/" -or $path -eq "") {
            $path = "/index.html"
        }

        $fullPath = Join-Path $staticDir ($path.Replace('/', '\').TrimStart('\'))

        $bytes = @()
        if ($path -eq "/api/health") {
            $json = '{"status":"OK","message":"Your API is running","timestamp":"' + (Get-Date -Format "o") + '"}'
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
            $res.ContentType = "application/json; charset=utf-8"
        } elseif (Test-Path $fullPath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($fullPath)
            if ($fullPath.EndsWith(".html")) { $res.ContentType = "text/html; charset=utf-8" }
            elseif ($fullPath.EndsWith(".css")) { $res.ContentType = "text/css" }
            elseif ($fullPath.EndsWith(".js")) { $res.ContentType = "application/javascript" }
            elseif ($fullPath.EndsWith(".json")) { $res.ContentType = "application/json" }
        } else {
            $res.StatusCode = 404
            $bytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
        }
        
        $res.ContentLength64 = $bytes.Length
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
        $res.OutputStream.Close()
        $res.Close()
    }
} finally {
    $listener.Stop()
}
