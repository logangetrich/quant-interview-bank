@echo off
chcp 65001 >nul
echo ==========================================
echo   Quant Interview Bank - 一键内测
echo ==========================================
echo.
cd /d "%~dp0"
node smoke_test.js
echo.
if %errorlevel%==0 (
  echo [PASS] 全部通过，没找到茬！
) else (
  echo [FAIL] 有失败项，见上方找茬清单
)
echo.
pause
