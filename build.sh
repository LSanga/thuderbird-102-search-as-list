#!/bin/sh
# Packages the add-on as an installable .xpi
set -e
cd "$(dirname "$0")"
VERSION=$(sed -n 's/.*"version": *"\([^"]*\)".*/\1/p' manifest.json | head -1)
OUT="search-as-list-$VERSION.xpi"
rm -f "$OUT"
zip -r -q "$OUT" manifest.json background.js api
echo "Built $OUT"
