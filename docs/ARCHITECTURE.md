# Architecture

## Overview

SOC DASH models the operational path from a security event to a documented case. It is intentionally local-first so incident-triage concepts can be practiced without a SIEM backend.

## Main layers

1. **Case intake**
   - Users register detections or incidents with structured context.

2. **Risk context**
   - The interface summarizes severity, status and operational priority.

3. **Local persistence**
   - Browser storage keeps the working dataset on the local device.

4. **Import/export**
   - JSON and CSV workflows support reproducible demos and evidence review.

5. **Analytics**
   - Aggregated views transform individual events into operational context.

## Security boundary

The repository is suitable for synthetic or sanitized data. Production incident data should not be imported unless the environment and handling controls explicitly permit it.

## Design goal

Keep the workflow explainable: every case should have enough context to understand what happened, why it matters and what action follows.
