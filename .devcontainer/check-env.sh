#!/usr/bin/env bash
set -euo pipefail

# If vars already present, OK. Otherwise try to source .devcontainer/.env (local fallback).
if [ -z "${POSTGRES_DB:-}" ] || [ -z "${POSTGRES_USER:-}" ] || [ -z "${POSTGRES_PASSWORD:-}" ]; then
  if [ -f .devcontainer/.env ]; then
    set -a
    # shellcheck disable=SC1091
    source .devcontainer/.env
    set +a
  fi
fi

missing=()
[ -z "${POSTGRES_DB:-}" ] && missing+=(POSTGRES_DB)
[ -z "${POSTGRES_USER:-}" ] && missing+=(POSTGRES_USER)
[ -z "${POSTGRES_PASSWORD:-}" ] && missing+=(POSTGRES_PASSWORD)

if [ ${#missing[@]} -gt 0 ]; then
  echo "ERROR: Missing required environment variables: ${missing[*]}" >&2
  echo "Set them as Codespaces repository secrets or create .devcontainer/.env locally." >&2
  exit 1
fi

echo "Environment check OK: ${POSTGRES_USER}@${POSTGRES_DB}" 