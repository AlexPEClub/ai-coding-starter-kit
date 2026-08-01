#!/usr/bin/env bash
# Tägliches Server-Aufräumen: Docker Build-Cache/Images, große Container-Logs,
# alte Playwright/Test-Artefakte im Projekt-Repo.
set -euo pipefail

PROJECT_DIR="/home/botti/projects/tms-2.0"
LOG_TAG="[server-cleanup $(date '+%Y-%m-%d %H:%M:%S')]"

echo "$LOG_TAG Start"

echo "$LOG_TAG Docker: gestoppte Container entfernen"
docker container prune -f

echo "$LOG_TAG Docker: ungenutzte Images entfernen (betrifft keine laufenden Container)"
docker image prune -af

echo "$LOG_TAG Docker: Build-Cache leeren"
docker builder prune -af

echo "$LOG_TAG Docker: Container-Logs > 100MB leeren (Container laufen weiter)"
sudo find /var/lib/docker/containers -name "*-json.log" -size +100M -print -exec truncate -s 0 {} \;

echo "$LOG_TAG Projekt: Playwright/Test-Artefakte leeren"
rm -rf "${PROJECT_DIR:?}/test-results"/* "${PROJECT_DIR:?}/playwright-report"/*

echo "$LOG_TAG Fertig"
