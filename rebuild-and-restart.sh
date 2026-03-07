#!/bin/bash
set -e

echo "Step 1: Cleaning build directory..."
cd /opt/scripts/crewclaw-ui
rm -rf .next/

echo "Step 2: Building..."
npm run build 2>&1 | tail -30

echo "Step 3: Stopping service and removing database..."
echo "!Ad3Moc3A0!" | sudo -S systemctl stop crewclaw-ui
echo "!Ad3Moc3A0!" | sudo -S rm -f /opt/data/crewclaw-ui/CrewClaw-UI.db

echo "Step 4: Starting service..."
echo "!Ad3Moc3A0!" | sudo -S systemctl start crewclaw-ui

sleep 5
echo "Step 5: Service status..."
echo "!Ad3Moc3A0!" | sudo -S systemctl status crewclaw-ui --no-pager

echo "Done!"
