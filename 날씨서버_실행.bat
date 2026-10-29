@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================
echo   산책 ON - 산책 코스 + 날씨 서버
echo   브라우저가 곧 자동으로 열립니다.
echo   (서버 종료: 이 창에서 Ctrl+C 또는 창 닫기)
echo ============================================
start "" http://localhost:8000/index.html
python server.py
pause
