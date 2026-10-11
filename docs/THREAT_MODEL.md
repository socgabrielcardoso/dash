# Local SOC dashboard threat model

This is a **validation plan**. The project is a local defensive study dashboard, not a production case-management/SIEM platform.

## Data boundaries
Case titles, analyst notes, indicators, uploaded/exported evidence, browser storage and imported JSON are untrusted. They can contain personal data and malicious markup. No actual incident records, live internal IP addresses or credentials belong in a public demo.

## Attack scenarios and acceptance criteria
| Scenario | Acceptance criterion |
| --- | --- |
| Stored/reflected XSS from case fields | User-supplied HTML/JS is rendered as text; no unsafe `innerHTML` on untrusted data |
| Import of malformed/oversized JSON | Schema/size validation, safe error message, no browser hang |
| Spreadsheet formula injection in export | Dangerous leading formula characters are neutralized in CSV output |
| Evidence leakage through localStorage, cache or service worker | Data-retention behavior documented; sensitive values excluded from offline caches |
| Offline service-worker cache poisoning/staleness | Cache allowlist, explicit versioning, controlled upgrades and no caching of evidence |
| Accidental public publishing of incident data | Sample fixtures synthetic; pre-commit check and review process |
| Misleading SOC metrics | Clearly label demo data; maintain deterministic unit/smoke tests |
| Third-party scripts and tracking | No unnecessary remote scripts, analytics or dynamic code execution |

## Release gate
Run the existing smoke-check script, confirm XSS/import/export negative cases, inspect service-worker cache scopes, test in an isolated browser profile and capture results tied to the commit SHA.

## UI standard
Favor a fixed, plain, responsive incident-console layout with accessible tables and statuses. No animated gradients, unnecessary dashboards or decorative AI elements. Visual design is not itself a security control.
