#!/usr/bin/env bash
#
# Pull the latest changes, rebuild the app and install it to /Applications.
#
#   ./scripts/update.sh
#
# Your library (~/Library/Application Support/com.damienbutler.documanage/)
# is stored outside the app bundle and is never touched by this script.

set -euo pipefail

APP_NAME="Docu Manage"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILT_APP="$REPO_ROOT/src-tauri/target/release/bundle/macos/$APP_NAME.app"
INSTALLED_APP="/Applications/$APP_NAME.app"

cd "$REPO_ROOT"

# Rust is often not on PATH in a non-interactive shell.
if ! command -v cargo >/dev/null 2>&1 && [ -f "$HOME/.cargo/env" ]; then
    # shellcheck disable=SC1091
    source "$HOME/.cargo/env"
fi

if ! command -v cargo >/dev/null 2>&1; then
    echo "error: Rust is not installed. See DEPLOY.md." >&2
    exit 1
fi

echo "==> Fetching changes"
if [ -n "$(git status --porcelain)" ]; then
    echo "You have uncommitted changes. Commit or stash them first." >&2
    git status --short >&2
    exit 1
fi
git pull --ff-only

echo "==> Installing npm dependencies"
npm install --silent

echo "==> Building (this takes about a minute)"
# The DMG step can fail locally when Finder automation is blocked, even though
# the .app itself built fine (see DEPLOY.md). We only care about the .app here,
# so don't let a DMG failure abort the install.
npm run build || echo "   (bundling reported an error — checking for the .app anyway)"

if [ ! -d "$BUILT_APP" ]; then
    echo "error: build did not produce $BUILT_APP" >&2
    exit 1
fi

if pgrep -f "$INSTALLED_APP/Contents/MacOS" >/dev/null 2>&1; then
    echo "==> Quitting the running app"
    osascript -e "quit app \"$APP_NAME\"" 2>/dev/null || true
    sleep 2
fi

echo "==> Installing to /Applications"
rm -rf "$INSTALLED_APP"
cp -R "$BUILT_APP" /Applications/
xattr -dr com.apple.quarantine "$INSTALLED_APP" 2>/dev/null || true

echo
echo "Done — $(defaults read "$INSTALLED_APP/Contents/Info.plist" CFBundleShortVersionString 2>/dev/null || echo "installed")"
echo "Open it from Spotlight (Cmd-Space) or run: open -a \"$APP_NAME\""
