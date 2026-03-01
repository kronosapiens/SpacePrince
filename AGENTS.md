# AGENTS

## Astronomy Engine Policy

- Primary objective: preserve or improve fidelity to the upstream `astronomy-engine` computational pipeline.
- Prefer algorithmic parity work (time scales, transforms, precession/nutation chain, light-time path, periodic terms) over dataset-specific tuning.
- Do not use empirical spot-corrections as the main accuracy strategy.
- If any temporary correction is introduced for debugging, it must be clearly marked and removed before finalizing.
- Evaluation windows are for measurement only, not targets for hand-tuned fixes.

## Version Scope Note

- `astronomy_engine_v1`: deterministic Cairo baseline with table-ingress style approximations; excellent bounded-domain sign parity, but not a full upstream astronomy port.
- `astronomy_engine_v2`: smaller-data/more-compute variant with parametric approximations; improved deployment profile in some cases, but lower robustness outside tuned domains.
- `astronomy_engine_v3`: deeper parity-focused hybrid (expanded transform/time handling and improved Moon/Sun treatment); higher accuracy than earlier approximations, still partial vs full upstream chain.
- `astronomy_engine_v4`: broader-range parity effort with additional upstream-inspired term-chain fidelity; improved effective range, but still not complete end-to-end upstream equivalence.
- `astronomy_engine_v5`: active full-range upstream-fidelity track; prioritize core pipeline correctness and generalization over benchmark-window optimization.
