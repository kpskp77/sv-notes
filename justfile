set unstable

[private]
default:
  @just --list

[script]
[doc('create http server for notes')]
serve:
  if [ -f conf.py ]; then
    uv run sphinx-build -M html . _build
    uv run python -m http.server -d _build/html -b 127.0.0.1 8000
  else
    uv run mkdocs serve
  fi
