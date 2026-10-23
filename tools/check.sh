#!/usr/bin/env bash
# Run before every commit: checks every script for syntax errors, then plays
# the game headlessly. Exits non-zero if anything is wrong.
set -e
cd "$(dirname "$0")/.."

echo "Checking JavaScript syntax..."
for f in $(find src -name '*.js'); do node --check "$f"; done

echo "Checking every script file is loaded by index.html..."
for f in $(find src -name '*.js'); do
  grep -q "src=\"$f\"" index.html || { echo "MISSING from index.html: $f"; exit 1; }
done

echo "Playing the game in a headless browser..."
python3 tools/smoke_test.py
