# Descarga (una sola vez, con internet) las librerias del frontend dentro del
# proyecto. Despues la app funciona 100% sin conexion.
#
# Uso (en la carpeta del proyecto):
#   powershell -ExecutionPolicy Bypass -File download-libs.ps1

$ErrorActionPreference = "Stop"
$dir = Join-Path $PSScriptRoot "src\main\resources\static\vendor"
New-Item -ItemType Directory -Force -Path $dir | Out-Null

Write-Host "Descargando librerias en:"
Write-Host "  $dir"
Write-Host ""

function Dl($url, $name) {
    Write-Host "  - $name"
    Invoke-WebRequest -Uri $url -OutFile (Join-Path $dir $name)
}

Dl "https://unpkg.com/react@18.2.0/umd/react.production.min.js"          "react.production.min.js"
Dl "https://unpkg.com/react-dom@18.2.0/umd/react-dom.production.min.js"  "react-dom.production.min.js"
Dl "https://unpkg.com/recharts@2.12.7/umd/Recharts.js"                   "recharts.min.js"
Dl "https://unpkg.com/lucide-react@0.383.0/dist/umd/lucide-react.js"     "lucide-react.min.js"
Dl "https://unpkg.com/@babel/standalone@7/babel.min.js"                  "babel.min.js"
Dl "https://cdn.tailwindcss.com"                                         "tailwind.js"

Write-Host ""
Write-Host "Listo. Ya puedes ejecutar la app sin internet:  mvn spring-boot:run"
