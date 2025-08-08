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
echo "=== Iniciando aplicación ==="
npm start
