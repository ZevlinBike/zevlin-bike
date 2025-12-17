Modular Test System (scaffold)

Structure
- types.ts — shared types for tests and results
- runner.ts — simple orchestrator to run selected tests and aggregate results
- registry.ts — central export of available tests
- tests/checkout-e2e.ts — first end-to-end checkout test (payment bypass supported)

Notes
- Tests are server-side modules. Do not import client-only code.
- Payment is bypassed by default to avoid charges; optionally use Stripe test key.
- Created orders are flagged with `is_training=true` to keep them separate.

