# `astro` package

Independent scientific-compute package for chart construction experiments.

Initial scope:
- longitude-only Chebyshev archive model
- Clenshaw evaluation
- block lookup/runtime query scaffolding
- validation pipeline scaffolding

This package is intentionally separate from `client/` while algorithms stabilize.

## CLI

Build archive:

```bash
npm run build:archive -- --start 2026-01-01 --end 2026-12-31 --out out/2026.json --report out/2026.report.json
```

Validate existing archive:

```bash
npm run validate:archive -- --archive out/2026.json --out out/2026.validate.json --step-minutes 30
```

Build sign-level oracle corpus (7 planets + ascendant sign):

```bash
npm run build:sign-corpus -- \
  --start 2026-01-01T00:00:00Z \
  --end 2026-01-02T00:00:00Z \
  --step-minutes 60 \
  --quantize-minutes 15 \
  --lat-bins 377 \
  --lon-bins -1224 \
  --out out/2026.sign-corpus.json
```
