#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
check(){ local actual; actual="$(git hash-object "public/assets/a320/$1")"; [[ "$actual" == "$2" ]] || { echo "Asset integrity failure: $1"; exit 1; }; }
check cockpit.glb b9f584c21f00fba72e31aeb08a2a521fd44c14a7
check cockpit-manifest.json e6aad61c33116bb8e8bbfac11e7b03fff5c4c2d3
check flightgear-source.tar.gz d327b3b21c7d6ccbe7f50bf3fcf292f1d897260a
check LICENSE.txt 23cb790338e191e29205d6f4123882c0583ef8eb
check NOTICE.txt 65aadd6656f1c8ccd5c9e8b47035c768db5ce9ad
test -s LICENSE
test -s docs/MANUAL.zh-TW.md
echo "All five audited assets verified"
