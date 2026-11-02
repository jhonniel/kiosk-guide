#!/usr/bin/env bash
cd "$(dirname "$0")"
exec bash "$(dirname "$0")/scripts/ubuntu-kiosk/setup-device.sh"
