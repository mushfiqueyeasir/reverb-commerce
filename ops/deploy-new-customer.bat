@echo off
setlocal enabledelayedexpansion
title Deploy New Customer (local)

REM =====================================================================
REM  Local equivalent of .github/workflows/deploy-new-customer.yml
REM
REM  You provide:
REM    1. The new store domain (for example https://www.example.com)
REM    2. A Supabase access token (sbp_...)
REM    3. A Vercel token
REM
REM  The script provisions Supabase (project, schema, seed, auth) and then
REM  deploys the frontend/website storefront to Vercel (project, env vars,
REM  production deployment, custom domain) using the Vercel file upload API
REM  instead of a Git source.
REM =====================================================================

cd /d "%~dp0.."

if not exist "backend\package.json" (
  echo Error: run this script from the repository root. >&2
  pause
  exit /b 1
)

where node >nul 2>nul
if errorlevel 1 (
  echo Error: Node.js is required but was not found on PATH. >&2
  pause
  exit /b 1
)

where git >nul 2>nul
if errorlevel 1 (
  echo Error: Git is required but was not found on PATH. >&2
  pause
  exit /b 1
)

set /p "SITE_URL=Store domain (for example https://www.example.com): "
if "%SITE_URL%"=="" (
  echo Error: store domain is required. >&2
  pause
  exit /b 1
)

set /p "SUBSCRIPTION_TRACKER_PROJECT_ID=Subscription tracker project ID (optional, leave blank for personal projects): "

set /p "SUPABASE_ACCESS_TOKEN=Supabase access token (sbp_...): "
if "%SUPABASE_ACCESS_TOKEN%"=="" (
  echo Error: Supabase access token is required. >&2
  pause
  exit /b 1
)

set /p "VERCEL_TOKEN=Vercel access token: "
if "%VERCEL_TOKEN%"=="" (
  echo Error: Vercel access token is required. >&2
  pause
  exit /b 1
)

set /p "BOOTSTRAP_ADMIN_EMAIL=Admin email (default: musfiqueyeasir@gmail.com): "
if "%BOOTSTRAP_ADMIN_EMAIL%"=="" set "BOOTSTRAP_ADMIN_EMAIL=mushfiqueyeasir@gmail.com"

set /p "BOOTSTRAP_ADMIN_PASSWORD=Admin password (min 10 chars, leave blank to generate): "
if "%BOOTSTRAP_ADMIN_PASSWORD%"=="" (
  echo Generating a random admin password...
  for /f "delims=" %%p in ('powershell -NoProfile -Command "$chars='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'; -join (1..16 | ForEach-Object { $chars[(Get-Random -Maximum $chars.Length)] })"') do set "BOOTSTRAP_ADMIN_PASSWORD=%%p"
  echo Generated admin password: !BOOTSTRAP_ADMIN_PASSWORD!
  echo Save this password now; it will not be shown again.
)

set "PROVISION_MODE=provision"
set "SUPABASE_PROJECT_REF="

for /f "delims=" %%s in ('git rev-parse HEAD') do set "RELEASE_SHA=%%s"
if "%RELEASE_SHA%"=="" (
  echo Error: unable to resolve the current Git commit. >&2
  pause
  exit /b 1
)

echo.
echo Provisioning store from local Git commit %RELEASE_SHA%
echo   SITE_URL : %SITE_URL%
echo   PROVISION_MODE: %PROVISION_MODE%
echo.

if not exist "backend\node_modules" (
  echo Installing backend dependencies...
  pushd backend
  call npm ci
  if errorlevel 1 (
    popd
    echo Error: npm ci failed. >&2
    pause
    exit /b 1
  )
  popd
)

pushd backend
set "SITE_URL=%SITE_URL%"
set "SUBSCRIPTION_TRACKER_PROJECT_ID=%SUBSCRIPTION_TRACKER_PROJECT_ID%"
set "SUPABASE_ACCESS_TOKEN=%SUPABASE_ACCESS_TOKEN%"
set "SUPABASE_PROJECT_REF=%SUPABASE_PROJECT_REF%"
set "PROVISION_MODE=%PROVISION_MODE%"
set "RELEASE_SHA=%RELEASE_SHA%"
set "RELEASE_REF=main"
set "VERCEL_TOKEN=%VERCEL_TOKEN%"
set "VERCEL_DEPLOY_MODE=upload"
set "BOOTSTRAP_ADMIN_EMAIL=%BOOTSTRAP_ADMIN_EMAIL%"
set "BOOTSTRAP_ADMIN_PASSWORD=%BOOTSTRAP_ADMIN_PASSWORD%"
call npm run store:provision
set "PROVISION_EXIT=%errorlevel%"
popd

if not "%PROVISION_EXIT%"=="0" (
  echo.
  echo Deployment failed with exit code %PROVISION_EXIT%. >&2
  pause
  exit /b %PROVISION_EXIT%
)

echo.
echo Deployment completed successfully.
echo The client registry was written under backend/clients/.
echo Local environment files were written to:
echo   - frontend\website\.env.<client-id>
echo   - .client-secrets\<client-id>.env
echo The client-id is derived from the store domain (see backend\clients\).
echo Run frontend dev with:  cd frontend\website ^&^& npm run dev:client -- <client-id>
echo.
pause
endlocal
exit /b 0