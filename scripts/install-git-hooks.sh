#!/bin/bash
# Установка Git-хуков (автопуш после коммита)
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOOKS_SRC="$ROOT/git-hooks"
HOOKS_DST="$ROOT/.git/hooks"

if [ ! -d "$ROOT/.git" ]; then
  echo "⚠️  Не найден .git — пропуск установки хуков"
  exit 0
fi

for hook in post-commit; do
  if [ -f "$HOOKS_SRC/$hook" ]; then
    cp "$HOOKS_SRC/$hook" "$HOOKS_DST/$hook"
    chmod +x "$HOOKS_DST/$hook"
    echo "✅ Установлен хук: $hook"
  fi
done
