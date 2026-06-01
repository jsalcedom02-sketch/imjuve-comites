@echo off
title IMJUVE - Abrir puerto en firewall
echo ============================================
echo  Abriendo puerto 3001 en Windows Firewall
echo ============================================
echo.
echo EJECUTE ESTE ARCHIVO COMO ADMINISTRADOR
echo (clic derecho ^> "Ejecutar como administrador")
echo.
netsh advfirewall firewall add rule name="IMJUVE Comites" dir=in action=allow protocol=TCP localport=3001 profile=private
echo.
if %errorlevel% equ 0 (
    echo LISTO. Ahora desde su celular (misma WiFi) abra:
    echo http://192.168.1.107:3001
) else (
    echo ERROR: No se pudo abrir el puerto.
    echo Asegurese de ejecutar como Administrador.
)
echo.
pause
