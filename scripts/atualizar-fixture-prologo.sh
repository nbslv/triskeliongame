#!/usr/bin/env bash
# Atualiza tests/fixtures/prologo/ com os roteiros do branch de narrativa.
set -euo pipefail
git fetch -q origin claude/triskelion-narrativa
mkdir -p tests/fixtures/prologo
for f in $(git ls-tree -r --name-only origin/claude/triskelion-narrativa content/dialogues | grep 'prologo_.*\.json$'); do
  git show "origin/claude/triskelion-narrativa:$f" > "tests/fixtures/prologo/$(basename "$f")"
done
echo "ok: $(ls tests/fixtures/prologo | wc -l) arquivos"
