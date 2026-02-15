#!/bin/bash
# Rollbook Services Manager
# Usage: ./scripts/rollbook-services.sh [install|uninstall|start|stop|restart|status|logs]

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LAUNCH_AGENTS_DIR="$HOME/Library/LaunchAgents"
SERVICES=("com.rollbook.supabase" "com.rollbook.frontend" "com.rollbook.tunnel")
PLIST_DIR="$SCRIPT_DIR/launchd"

install() {
    mkdir -p "$LAUNCH_AGENTS_DIR"
    for svc in "${SERVICES[@]}"; do
        cp "$PLIST_DIR/$svc.plist" "$LAUNCH_AGENTS_DIR/"
        echo "Installed $svc"
    done
    echo "Done. Run '$0 start' to start services."
}

uninstall() {
    stop
    for svc in "${SERVICES[@]}"; do
        rm -f "$LAUNCH_AGENTS_DIR/$svc.plist"
        echo "Removed $svc"
    done
}

start() {
    for svc in "${SERVICES[@]}"; do
        launchctl load "$LAUNCH_AGENTS_DIR/$svc.plist" 2>/dev/null
        echo "Started $svc"
    done
}

stop() {
    for svc in "${SERVICES[@]}"; do
        launchctl unload "$LAUNCH_AGENTS_DIR/$svc.plist" 2>/dev/null
        echo "Stopped $svc"
    done
}

restart() {
    stop
    sleep 2
    start
}

status() {
    echo "=== Rollbook Services ==="
    for svc in "${SERVICES[@]}"; do
        pid=$(launchctl list "$svc" 2>/dev/null | grep -o '"PID" = [0-9]*' | grep -o '[0-9]*')
        if [ -n "$pid" ]; then
            echo "  $svc: RUNNING (PID $pid)"
        else
            exit_code=$(launchctl list "$svc" 2>/dev/null | grep -o '"LastExitStatus" = [0-9]*' | grep -o '[0-9]*')
            if [ -n "$exit_code" ]; then
                echo "  $svc: STOPPED (exit code $exit_code)"
            else
                echo "  $svc: NOT LOADED"
            fi
        fi
    done
    echo ""
    echo "=== Port Check ==="
    echo "  Supabase API (54321): $(curl -sf http://localhost:54321/rest/v1/ -H 'apikey: dummy' > /dev/null 2>&1 && echo 'UP' || echo 'DOWN')"
    echo "  Frontend (4173):      $(curl -sf http://localhost:4173 > /dev/null 2>&1 && echo 'UP' || echo 'DOWN')"
    echo "  Tunnel:               $(launchctl list com.rollbook.tunnel 2>/dev/null | grep -q 'PID' && echo 'CONNECTED' || echo 'DOWN')"
}

logs() {
    echo "=== Recent logs ==="
    for svc in "${SERVICES[@]}"; do
        short_name="${svc#com.rollbook.}"
        echo "--- $short_name ---"
        tail -5 "/tmp/rollbook-$short_name.log" 2>/dev/null || echo "  No logs yet"
        echo ""
    done
}

case "${1:-status}" in
    install)   install ;;
    uninstall) uninstall ;;
    start)     start ;;
    stop)      stop ;;
    restart)   restart ;;
    status)    status ;;
    logs)      logs ;;
    *)         echo "Usage: $0 [install|uninstall|start|stop|restart|status|logs]" ;;
esac
