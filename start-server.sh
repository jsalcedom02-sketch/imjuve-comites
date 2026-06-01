#!/bin/bash
cd "$(dirname "$0")/server"
echo "Instalando dependencias..."
npm install
echo ""
echo "Sembrando datos de prueba..."
npx tsx src/seed.ts
echo ""
echo "Iniciando servidor..."
PORT=3001 npx tsx src/index.ts