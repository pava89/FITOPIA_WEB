@echo off
chcp 65001 >nul
title FITOPIA - servidor local
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 goto sinnode
echo.
echo   Iniciando FITOPIA... se abrira el navegador en unos segundos.
echo   NO cierres esta ventana mientras uses la pagina.
node server.js --abrir
echo.
echo   El servidor se detuvo.
pause
exit /b

:sinnode
echo.
echo   No se encontro Node.js en este computador.
echo   Abriendo FITOPIA en modo demo (funciona sin servidor).
echo   Para el modo servidor instala Node.js desde https://nodejs.org
echo.
start "" "%~dp0public\index.html"
pause
