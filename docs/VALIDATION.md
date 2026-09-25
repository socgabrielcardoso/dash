# Validation

## Automated

Use the repository's existing GitHub Actions workflows as the baseline quality gate.

## Manual smoke test

1. Load the dashboard locally.
2. Create a new case.
3. Change status and severity.
4. Verify overview metrics react correctly.
5. Export data as JSON and CSV.
6. Re-import a valid local dataset.
7. Confirm invalid or incomplete inputs fail safely.

## Acceptance criteria

Case data must remain coherent across create, update, export and import operations. Security-relevant values should be presented consistently enough to support triage rather than create ambiguity.
