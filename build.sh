#!/bin/bash
# ==========================================
# Homelab Dashboard Remote Build & Deploy
# Copies files, builds Docker image remotely,
# and runs the container on the remote host.
# ==========================================

set -e  # Exit on error

# ---[ CONFIGURATION ]---
IMAGE_NAME="links"
CONTAINER_NAME="links"
REMOTE_USER="ubuntu"
REMOTE_HOST="192.168.1.24"
SSH_PORT="22"
REMOTE_PATH="/home/${REMOTE_USER}/apps/links"
LOCAL_PORT="80"
REMOTE_WEB_PORT="8080"

# ---[ HELPER FUNCTIONS ]---
function info() {
  echo -e "\033[1;34m[INFO]\033[0m $1"
}
function success() {
  echo -e "\033[1;32m[SUCCESS]\033[0m $1"
}
function error() {
  echo -e "\033[1;31m[ERROR]\033[0m $1" >&2
}

# ---[ DEPLOY STEPS ]---
info "Creating remote project directory"
ssh -p "${SSH_PORT}" "${REMOTE_USER}@${REMOTE_HOST}" "mkdir -p ${REMOTE_PATH}"

info "Copying local files to remote machine"
scp -P "${SSH_PORT}" index.html style.css main.js favicon.ico Dockerfile "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/"

info "Building Docker image on remote host"
ssh -p "${SSH_PORT}" "${REMOTE_USER}@${REMOTE_HOST}" "
  cd ${REMOTE_PATH} &&
  docker build -t ${IMAGE_NAME} .
"

info "Stopping and removing old container (if any)"
ssh -p "${SSH_PORT}" "${REMOTE_USER}@${REMOTE_HOST}" "
  docker stop ${CONTAINER_NAME} >/dev/null 2>&1 || true &&
  docker rm ${CONTAINER_NAME} >/dev/null 2>&1 || true
"

info "Starting container on remote host"
ssh -p "${SSH_PORT}" "${REMOTE_USER}@${REMOTE_HOST}" "
  docker run -d --name ${CONTAINER_NAME} -p ${REMOTE_WEB_PORT}:${LOCAL_PORT} ${IMAGE_NAME}
"

success "Deployment complete!"
echo "Your dashboard is available at: http://${REMOTE_HOST}:${REMOTE_WEB_PORT}"
