@echo off
title IMJUVE - Plataforma Comités
cd /d "%~dp0server"
echo Instalando dependencias...
call npm install
echo.
echo Sembrando datos de prueba...
call npx tsx src/seed.ts
echo.
echo Iniciando servidor...
set PORT=3001
npx tsx src/index.ts
pause