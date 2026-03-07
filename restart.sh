#!/bin/bash
echo "!Ad3Moc3A0!" | sudo -S rm -f /opt/data/crewclaw-ui/CrewClaw-UI.db
echo "!Ad3Moc3A0!" | sudo -S systemctl restart crewclaw-ui
sleep 5
echo "!Ad3Moc3A0!" | sudo -S systemctl status crewclaw-ui --no-pager
