#!/usr/bin/env bash
# Descarga (una sola vez, con internet) las librerias del frontend dentro del
# proyecto. Despues la app funciona 100% sin conexion.
#
# Uso:   bash download-libs.sh
set -e

DIR="$(cd "$(dirname "$0")" && pwd)/src/main/resources/static/vendor"
mkdir -p "$DIR"
echo "Descargando librerias en:"
echo "  $DIR"
echo

dl() {
  echo "  - $2"
  curl -fL "$1" -o "$DIR/$2"
}

dl "https://unpkg.com/react@18.2.0/umd/react.production.min.js"          "react.production.min.js"
dl "https://unpkg.com/react-dom@18.2.0/umd/react-dom.production.min.js"  "react-dom.production.min.js"
dl "https://unpkg.com/recharts@2.12.7/umd/Recharts.js"                   "recharts.min.js"
dl "https://unpkg.com/lucide-react@0.383.0/dist/umd/lucide-react.js"     "lucide-react.min.js"
dl "https://unpkg.com/@babel/standalone@7/babel.min.js"                  "babel.min.js"
dl "https://cdn.tailwindcss.com"                                         "tailwind.js"

echo
echo "Listo. Ya puedes ejecutar la app sin internet:  mvn spring-boot:run"
