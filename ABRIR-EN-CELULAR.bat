@echo off
chcp 65001 >nul
title FITOPIA - servidor en la red Wi-Fi
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo   No se encontro Node.js. Instalalo desde https://nodejs.org
  pause
  exit /b
)
echo.
echo   Conecta el celular a la MISMA red Wi-Fi que este computador
echo   y abre la direccion que aparece abajo ("Desde el celular").
echo   Si Windows pregunta por el firewall, permite el acceso en redes privadas.
echo.
node server.js --abrir --red
pause
