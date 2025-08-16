param(
	[int]$Port = 5500,
	[string]$Root = $(Split-Path -Parent $MyInvocation.MyCommand.Path)
)

Add-Type -AssemblyName System.Net.HttpListener

$prefix = "http://localhost:$Port/"
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add($prefix)

try {
	$listener.Start()
} catch {
	Write-Error "Failed to start server on $prefix. $_"
	exit 1
}

Write-Host "Serving $Root at $prefix"

$mimeTypes = @{
	'.html' = 'text/html; charset=utf-8'
	'.htm'  = 'text/html; charset=utf-8'
	'.css'  = 'text/css; charset=utf-8'
	'.js'   = 'application/javascript; charset=utf-8'
	'.png'  = 'image/png'
	'.jpg'  = 'image/jpeg'
	'.jpeg' = 'image/jpeg'
	'.gif'  = 'image/gif'
	'.svg'  = 'image/svg+xml'
	'.ico'  = 'image/x-icon'
	'.txt'  = 'text/plain; charset=utf-8'
}

while ($listener.IsListening) {
	try {
		$context = $listener.GetContext()
		$request = $context.Request
		$response = $context.Response

		$localPath = $request.Url.LocalPath.TrimStart('/').Replace('/', [System.IO.Path]::DirectorySeparatorChar)
		if ([string]::IsNullOrWhiteSpace($localPath)) { $localPath = 'index.html' }

		$combined = Join-Path $Root $localPath
		$fullPath = [System.IO.Path]::GetFullPath($combined)

		if (-not $fullPath.StartsWith($Root, [System.StringComparison]::OrdinalIgnoreCase)) {
			$response.StatusCode = 403
			$response.Close()
			continue
		}

		if (Test-Path -LiteralPath $fullPath -PathType Container) {
			$fullPath = Join-Path $fullPath 'index.html'
		}

		if (-not (Test-Path -LiteralPath $fullPath -PathType Leaf)) {
			$response.StatusCode = 404
			$response.Close()
			continue
		}

		$ext = [System.IO.Path]::GetExtension($fullPath).ToLowerInvariant()
		$contentType = $mimeTypes[$ext]
		if (-not $contentType) { $contentType = 'application/octet-stream' }

		$bytes = [System.IO.File]::ReadAllBytes($fullPath)
		$response.ContentType = $contentType
		$response.ContentLength64 = $bytes.LongLength
		$response.AddHeader('Cache-Control','no-cache')
		$response.OutputStream.Write($bytes, 0, $bytes.Length)
		$response.Close()
	} catch {
		try { $response.StatusCode = 500; $response.Close() } catch {}
	}
}


