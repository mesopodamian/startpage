#!/usr/bin/env bash
# Copies this project to the server, where ~/apps/build.sh builds the image,
# starts it and pushes it to the local registry.
set -euo pipefail

APP="startpage-sync"
SERVER="${SERVER:-ubuntu@192.168.1.24}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

version="$(date +%Y%m%d-%H%M%S)"
if commit="$(git -C "${ROOT_DIR}" rev-parse --short HEAD 2>/dev/null)"; then
  version+="-${commit}"
  [[ -z "$(git -C "${ROOT_DIR}" status --porcelain -- .)" ]] || version+="-dirty"
fi

printf '\033[1;34m[INFO]\033[0m %s\n' "Copying ${APP} to ${SERVER}:builds/${APP}"
ssh "${SERVER}" "mkdir -p ~/builds/${APP}"
rsync -az --delete \
  --exclude '.git/' \
  --exclude '.env' \
  --exclude '.env.deploy' \
  --exclude '*.log' \
  --exclude '.DS_Store' \
  --exclude 'bin/' \
  --exclude 'obj/' \
  --exclude 'config/' \
  "${ROOT_DIR}/" \
  "${SERVER}:builds/${APP}/"

ssh "${SERVER}" "~/apps/build.sh '${APP}' '${version}'"
