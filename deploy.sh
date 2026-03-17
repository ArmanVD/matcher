#!/bin/bash
set -e

SERVER="root@72.61.178.22"
REMOTE_DIR="/var/www/matcher"
LOCAL_DIR="$(dirname "$0")"

echo "→ Uploading files..."
rsync -avz --exclude 'node_modules' --exclude '.env' --exclude 'dist' "$LOCAL_DIR/" "$SERVER:$REMOTE_DIR/"

echo "→ Building and restarting..."
ssh "$SERVER" "cd $REMOTE_DIR && npm install --omit=dev && npm run build && pm2 restart matcher"

echo "✓ Done — https://matcherapp.nl"
