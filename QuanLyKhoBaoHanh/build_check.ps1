$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$csproj = Join-Path $root 'QuanLyKhoBaoHanh\QuanLyKhoBaoHanh.csproj'
$log = Join-Path $root 'build_check_log.txt'
"Building: $csproj" | Out-File $log -Encoding utf8
Set-Location (Split-Path $csproj)
dotnet build $csproj -c Debug --nologo *>> $log
"EXIT=$LASTEXITCODE" | Out-File $log -Append -Encoding utf8
exit $LASTEXITCODE
