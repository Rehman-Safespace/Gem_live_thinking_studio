@echo off
chcp 65001 >nul
title Sheikh Gemini Studio v9.3 — Instant PC App Mode
set "APP_HTML=%~dp0index.html"
where msedge >nul 2>nul && (start "" msedge --app="file:///%APP_HTML:\=/%" & exit /b)
where chrome >nul 2>nul && (start "" chrome --app="file:///%APP_HTML:\=/%" & exit /b)
start "" "%APP_HTML%"
exit
