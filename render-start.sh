#!/bin/bash
set -e  # Salir inmediatamente si cualquier comando falla

echo "=== Iniciando proceso de arranque para Render ==="

# Verificar si existe el directorio de backup
if [ -d "/opt/render/.next-backup" ] && [ "$(ls -A /opt/render/.next-backup)" ]; then
    echo "=== Restaurando directorio .next desde backup ==="
    mkdir -p .next
    cp -r /opt/render/.next-backup/* .next/
    echo "=== Directorio .next restaurado ==="
    ls -la .next
else
    echo "=== ADVERTENCIA: No se encontró backup del directorio .next ==="
    echo "=== Intentando iniciar de todos modos ==="
fi

# Iniciar la aplicación
echo "=== Iniciando aplicación en modo standalone ==="
# Usar el comando recomendado para output: standalone
if [ -f "./.next/standalone/server.js" ]; then
    node ./.next/standalone/server.js
else
    echo "=== No se encontró server.js en modo standalone, usando npm start ==="
    npm start
fi
