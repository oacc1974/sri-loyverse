#!/bin/bash
set -e  # Salir inmediatamente si cualquier comando falla

echo "=== Iniciando proceso de construcción para Render ==="

# Eliminar archivos conflictivos
echo "=== Eliminando archivos conflictivos ==="
if [ -f "src/app/configuracion/page.tsx" ]; then
  echo "Eliminando archivo conflictivo: src/app/configuracion/page.tsx"
  rm -f "src/app/configuracion/page.tsx"
fi

# Eliminar archivos temporales que pueden causar errores de compilación
echo "=== Eliminando archivos temporales ==="
if [ -f "prueba-sri-fixed.tsx" ]; then
  echo "Eliminando archivo temporal: prueba-sri-fixed.tsx"
  rm -f "prueba-sri-fixed.tsx"
fi

# Mostrar información del entorno
echo "=== Información del entorno ==="
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "Directorio actual: $(pwd)"

# Instalar dependencias con opciones adicionales
echo "=== Instalando dependencias ==="
npm install --legacy-peer-deps

# Construir la aplicación
echo "=== Construyendo la aplicación ==="
NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Verificar si la construcción fue exitosa
if [ -d ".next" ]; then
    echo "=== Construcción exitosa. Directorio .next creado ==="
    ls -la .next
    
    # Crear directorio .next-backup en una ubicación persistente
    echo "=== Creando copia de seguridad del directorio .next ==="
    mkdir -p /opt/render/.next-backup
    rm -rf /opt/render/.next-backup/*  # Limpiar backup anterior
    cp -r .next/* /opt/render/.next-backup/
    ls -la /opt/render/.next-backup  # Verificar contenido del backup
    echo "=== Copia de seguridad creada en /opt/render/.next-backup ==="
else
    echo "=== ERROR: La construcción falló. No se encontró el directorio .next ==="
    exit 1
fi

echo "=== Proceso de construcción completado ==="
