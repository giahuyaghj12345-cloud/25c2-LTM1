@echo off
cd /d "%~dp0"
if not exist "frontend\dist\index.html" (
  echo Dang dong goi giao dien...
  call npm run build --prefix frontend
)
cd desktop
call npm start
