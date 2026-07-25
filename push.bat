@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo === Dang day thay doi len GitHub ===
git add -A
git commit -m "cap nhat %date% %time%"
git push
echo.
echo === Da push. GitHub Actions dang build (~40 giay) ===
echo Link app: https://giapdn-13.github.io/quizprep/
echo Xem tien trinh: gh run watch
timeout /t 5 >nul
