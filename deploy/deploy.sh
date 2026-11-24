#!/bin/bash
# This script runs ON the AWS server (EC2).
# GitHub Actions runs it after every push to main, and you can also run it by hand:
#   bash ~/hosting/deploy/deploy.sh

set -e # stop at the first command that fails, so a broken build never gets started

cd ~/hosting

echo "==> 1/4  Getting the latest code from GitHub"
git fetch origin main
git reset --hard origin/main # make the server's code exactly match GitHub (.env and uploads are kept)

echo "==> 2/4  Installing backend packages"
cd ~/hosting/Backend
npm ci --omit=dev

echo "==> 3/4  Building the React website"
cd ~/hosting/frontend
npm ci
npm run build

echo "==> 4/4  Restarting the app"
sudo systemctl restart inventory

echo "==> Done! The new version is live."
