$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:8080/")
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

        if (Test-Path $fullPath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($fullPath)
            if ($fullPath.EndsWith(".html")) { $res.ContentType = "text/html; charset=utf-8" }
            elseif ($fullPath.EndsWith(".css")) { $res.ContentType = "text/css" }
            elseif ($fullPath.EndsWith(".js")) { $res.ContentType = "application/javascript" }
            
            $res.ContentLength64 = $bytes.Length
            $res.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $res.StatusCode = 404
            $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $res.OutputStream.Write($msg, 0, $msg.Length)
        }
        $res.Close()
    }
} finally {
    $listener.Stop()
}
