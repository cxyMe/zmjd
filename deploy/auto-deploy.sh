#!/bin/bash
# Auto-deploy script for zmjd
# Compares local and remote commit hashes, pulls and restarts if different.

set -euo pipefail

PROJECT_DIR="/opt/zmjd"
LOG_FILE="/var/log/zmjd-deploy.log"
BRANCH="main"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

cd "$PROJECT_DIR" || {
  log "ERROR: Cannot cd to $PROJECT_DIR"
  exit 1
}

log "Fetching origin/${BRANCH}..."
git fetch origin "$BRANCH"

LOCAL_HASH=$(git rev-parse "${BRANCH}")
REMOTE_HASH=$(git rev-parse "origin/${BRANCH}")

if [ "$LOCAL_HASH" = "$REMOTE_HASH" ]; then
  log "No updates. Local and remote are at ${LOCAL_HASH}."
  exit 0
fi

log "Update detected: local=${LOCAL_HASH} -> remote=${REMOTE_HASH}"
log "Pulling latest code..."
git pull origin "$BRANCH"

log "Restarting zmjd service..."
if systemctl restart zmjd; then
  log "Deployment completed successfully."
else
  log "ERROR: Failed to restart zmjd service."
  exit 1
fi
