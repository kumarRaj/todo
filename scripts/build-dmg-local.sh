#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

PRODUCT_NAME="$(node -e "const pkg=require('./package.json'); const name=(pkg.build && pkg.build.productName)||pkg.productName||'Todo App'; process.stdout.write(name);")"
VERSION="$(node -e "process.stdout.write(require('./package.json').version)")"

APP_PATH="dist/mac-arm64/${PRODUCT_NAME}.app"
DMG_PATH="dist/${PRODUCT_NAME}-${VERSION}-arm64.dmg"

rm -f "$DMG_PATH"

echo "Building macOS app bundle..."
npm run build:mac-dir

if [[ ! -d "$APP_PATH" ]]; then
  echo "App bundle not found at: $APP_PATH"
  exit 1
fi

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

RW_DMG_PATH="${TMP_DIR}/${PRODUCT_NAME}-${VERSION}-rw.dmg"
TMP_DMG_PATH="${TMP_DIR}/${PRODUCT_NAME}-${VERSION}-arm64.dmg"
MOUNT_POINT="/Volumes/${PRODUCT_NAME// /}-${VERSION}-tmp-$$"

APP_SIZE_MB="$(du -sm "$APP_PATH" | awk '{print $1}')"
DMG_SIZE_MB=$((APP_SIZE_MB + 200))

echo "Creating staging DMG (${DMG_SIZE_MB}MB)..."
hdiutil create -size "${DMG_SIZE_MB}m" -fs APFS -volname "$PRODUCT_NAME" "$RW_DMG_PATH"

echo "Mounting staging DMG..."
hdiutil attach "$RW_DMG_PATH" -mountpoint "$MOUNT_POINT"

echo "Copying app bundle to staging DMG..."
cp -R "$APP_PATH" "$MOUNT_POINT/"
sync
sleep 2

echo "Detaching staging DMG..."
hdiutil detach -force "$MOUNT_POINT"

echo "Converting DMG to compressed format..."
hdiutil convert "$RW_DMG_PATH" -format UDZO -o "$TMP_DMG_PATH"

mv "$TMP_DMG_PATH" "$DMG_PATH"

echo "DMG created at: $DMG_PATH"
