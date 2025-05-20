#!/usr/bin/env bash
# exit on error
set -o errexit

npm install
# Install Chrome for Puppeteer
apt-get update
apt-get install -y --no-install-recommends \
    libgconf-2-4 \
    libnss3 \
    libxss1 \
    libasound2 \
    fonts-liberation \
    libappindicator3-1 \
    xdg-utils \
    wget

CHROME_VERSION="114.0.5735.90"
wget --no-verbose -O /tmp/chrome.deb https://dl.google.com/linux/chrome/deb/pool/main/g/google-chrome-stable/google-chrome-stable_${CHROME_VERSION}-1_amd64.deb
apt-get install -y /tmp/chrome.deb
rm /tmp/chrome.deb

# Set Puppeteer executable path
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome