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
