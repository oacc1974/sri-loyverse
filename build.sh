#!/bin/bash
set -e  # Salir inmediatamente si cualquier comando falla

echo "=== Iniciando proceso de construcción ==="

# Mostrar información del entorno
echo "=== Información del entorno ==="
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "Directorio actual: $(pwd)"
ls -la

# Limpiar caché y directorios anteriores
echo "=== Limpiando caché y directorios anteriores ==="
rm -rf .next || true
rm -rf node_modules/.cache || true

# Instalar dependencias con opciones adicionales
echo "=== Instalando dependencias ==="
npm install --no-optional --legacy-peer-deps

# Asegurar que TypeScript esté instalado
echo "=== Verificando TypeScript ==="
npm list typescript || npm install typescript --save
echo "TypeScript version: $(./node_modules/.bin/tsc --version || echo 'No instalado')"

# Mostrar contenido de tsconfig.json
echo "=== Contenido de tsconfig.json ==="
cat tsconfig.json || echo "No existe tsconfig.json"

# Construir la aplicación
echo "=== Construyendo la aplicación ==="
NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Verificar si la construcción fue exitosa
if [ -d ".next" ]; then
    echo "=== Construcción exitosa. Directorio .next creado ==="
    ls -la .next
    echo "Contenido del directorio .next/:"
    find .next -type f | head -n 20
else
    echo "=== ERROR: La construcción falló. No se encontró el directorio .next ==="
    echo "Mostrando logs de error:"
    cat npm-debug.log || echo "No hay archivo npm-debug.log"
    exit 1
fi

echo "=== Proceso de construcción completado ==="
