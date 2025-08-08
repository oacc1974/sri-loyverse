#!/bin/bash
echo "Iniciando proceso de construcción..."

# Instalar dependencias
echo "Instalando dependencias..."
npm install

# Verificar la instalación de TypeScript
echo "Verificando TypeScript..."
if ! command -v ./node_modules/.bin/tsc &> /dev/null; then
    echo "TypeScript no está instalado correctamente. Instalando..."
    npm install typescript --save
fi

# Mostrar versiones
echo "Versiones de Node y npm:"
node -v
npm -v
echo "Versión de TypeScript:"
./node_modules/.bin/tsc --version

# Limpiar caché de Next.js
echo "Limpiando caché de Next.js..."
rm -rf .next
rm -rf node_modules/.cache

# Construir la aplicación
echo "Construyendo la aplicación..."
npm run build

# Verificar si la construcción fue exitosa
if [ -d ".next" ]; then
    echo "Construcción exitosa. Directorio .next creado."
    ls -la .next
else
    echo "Error: La construcción falló. No se encontró el directorio .next."
    exit 1
fi

echo "Proceso de construcción completado."
