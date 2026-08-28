@echo off
chcp 65001 >nul
title Quant Interview Bank - 量化面试题库
cd /d "%~dp0"

echo ============================================
echo   Quant Interview Bank  量化面试题库 3921 题
echo   http://localhost:8090
echo ============================================
echo.

:: 1. 检查 Node 是否可用
where node >nul 2>nul
if %errorlevel% neq 0 (
  echo [错误] 未找到 Node.js，请先安装: https://nodejs.org
  pause
  exit /b 1
)

:: 2. 启动 LLM 代理 (8787) —— 如果没在跑
netstat -ano | findstr ":8787" | findstr "LISTENING" >nul 2>nul
if %errorlevel% equ 0 (
  echo [OK] LLM 代理已在运行 (8787)
) else (
  echo [启动] LLM 代理 (8787) ...
  start "QIB-LLM" /min node llm_server.js 8787
  timeout /t 2 /nobreak >nul
)

:: 3. 启动静态服务器 (8090) —— 如果没在跑
netstat -ano | findstr ":8090" | findstr "LISTENING" >nul 2>nul
if %errorlevel% equ 0 (
  echo [OK] 静态服务器已在运行 (8090)
) else (
  echo [启动] 静态服务器 (8090) ...
  start "QIB-Web" /min node web_server.js 8090
  timeout /t 2 /nobreak >nul
)

:: 4. 打开浏览器
start http://localhost:8090/

echo.
echo 已启动！浏览器将打开题库首页。
echo 提示：AI 功能需要本地 LLM 代理，如果页面右上角
echo       出现"⚠️ 线上版"提示，请确认 8787 端口正常。
echo.
pause
