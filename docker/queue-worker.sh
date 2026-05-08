#!/bin/bash
set -e

log() { echo "[$(date '+%H:%M:%S')] [QUEUE] $*"; }

log "Waiting for app + redis..."
sleep 5

log "Starting queue worker..."
exec php artisan queue:work redis \
    --sleep=3 \
    --tries=3 \
    --max-jobs=1000 \
    --max-time=3600 \
    --verbose
