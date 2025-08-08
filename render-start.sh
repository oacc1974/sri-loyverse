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

# Mostrar variables de entorno (sin valores sensibles)
echo "=== Verificando variables de entorno ==="
if [ -n "$MONGODB_URI" ]; then
    echo "MONGODB_URI está configurada"
else
    echo "ADVERTENCIA: MONGODB_URI no está configurada"
fi

# Verificar directorios
echo "=== Verificando directorios ==="
ls -la
echo "=== Contenido de .next (si existe) ==="
if [ -d ".next" ]; then
    ls -la .next
    if [ -d ".next/standalone" ]; then
        echo "=== Contenido de .next/standalone ==="
        ls -la .next/standalone
    else
        echo "ADVERTENCIA: No existe el directorio .next/standalone"
    fi
else
    echo "ADVERTENCIA: No existe el directorio .next"
fi

# Iniciar la aplicación
echo "=== Iniciando aplicación con servidor personalizado ==="
# Verificar si existe el archivo server-custom.js
if [ -f "./server-custom.js" ]; then
    echo "=== Iniciando con node ./server-custom.js ==="
    # Copiar node_modules al directorio standalone si es necesario
    if [ -d "./.next/standalone" ] && [ ! -d "./.next/standalone/node_modules/next" ]; then
        echo "=== Copiando node_modules a directorio standalone ==="
        mkdir -p ./.next/standalone/node_modules
        cp -r ./node_modules/next ./.next/standalone/node_modules/
    fi
    # Iniciar con servidor personalizado
    NODE_ENV=production PORT=${PORT:-10000} node ./server-custom.js
else
    echo "=== No se encontró server-custom.js, intentando con server.js ==="
    # Usar el comando recomendado para output: standalone
    if [ -f "./.next/standalone/server.js" ]; then
        echo "=== Iniciando con node ./.next/standalone/server.js ==="
        NODE_ENV=production PORT=${PORT:-10000} node ./.next/standalone/server.js
    else
        echo "=== No se encontró server.js en modo standalone, usando npm start ==="
        npm start
    fi
fi
