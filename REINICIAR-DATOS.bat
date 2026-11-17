@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo   Esto borra pedidos, cuentas nuevas y cambios, y vuelve a los datos de ejemplo.
echo   Cierra primero la ventana del servidor si esta abierta.
echo.
choice /M "  Deseas continuar"
if errorlevel 2 exit /b
if exist "data\db.json" del /q "data\db.json"
if exist "data\auditoria.jsonl" del /q "data\auditoria.jsonl"
echo.
echo   Listo. Ahora abre INICIAR-FITOPIA.bat
pause
