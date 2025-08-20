@echo off
setlocal EnableDelayedExpansion

set RETRIES=0
set MAX_RETRIES=100

:loop
echo Starting stream... Attempt !RETRIES!
ffmpeg -rtsp_transport tcp -re -i rtsp://admin:abcd1234@192.168.1.99:554/h264/ch1/sub/av_stream -fflags nobuffer -flags low_delay -strict experimental -f mjpeg -q:v 5 -r 10 -an http://localhost:8090/feed1

echo Stream crashed. Exit code: !errorlevel!
set /a RETRIES+=1

if !RETRIES! GEQ !MAX_RETRIES! (
    echo Max retries reached. Exiting...
    exit /b
)

timeout /t 2
goto loop
