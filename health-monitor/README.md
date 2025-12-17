Health Monitor (scaffold)

This module is an isolated place to build a system health and test monitor for the Zevlin Bike ecommerce app and its admin dashboard. It keeps its own components, configs, and check registry without impacting the main app until we decide to wire it in.

Contents
- docs/PROPOSAL.md — tailored proposal and plan
- config/ — types and example configuration for checks
- checks/ — check registry and stubs for domain-specific checks
- components/ — small React components for rendering health status (standalone scaffold)

Notes
- This is a scaffold meant for the Health Monitor branch. We can later mount the UI under an admin route (e.g., /admin/health) or ship it as a background job runner + page.

