# İsim Şehir — v3.0 CI/CD Pipeline

> **Priority:** P02 — automates quality gates
> **Version target:** v3.0
> **Status:** 🔵 Draft

## Overview

The project has no CI/CD pipeline. Every push goes to Vercel for auto-deploy without any quality checks. This spec adds a GitHub Actions workflow that runs lint, typecheck, tests, and build on every push and PR, with automated deployment to Vercel on main.

## Requirements

### 1. Pull Request Checks (`pull_request` trigger)

On every PR to `main`:

| Step | Command | Purpose |
|---|---|---|
| `setup` | `actions/checkout` + `setup-node` + `npm ci` | Install dependencies |
| `lint` | `npm run lint` (tsc --noEmit) | Type checking |
| `test` | `npm test` (vitest run) | Unit + integration tests |
| `build` | `npm run build` | Verify production build succeeds |
| `bundle-size` | Compare dist/ size against main baseline | Warn on significant size increase |

- All steps must pass for the PR to be mergable (branch protection rule).
- Cache `node_modules` across runs for speed.

### 2. Main Branch CI + Deploy (`push` to `main`)

On every push to `main`:

| Step | Command | Purpose |
|---|---|---|
| `setup` | Same as above | |
| `lint` | `npm run lint` | |
| `test` | `npm test` | |
| `build` | `npm run build` | |
| `deploy` | Vercel deploy via `vercel/deploy` action | Auto-deploy to production |
| `e2e` (post-deploy) | `npm run test:e2e` against the deployed URL | Smoke test production |

- If any step fails before `deploy`, the deploy is skipped.
- If E2E fails after deploy, notify (but don't roll back — the Vercel auto-deploy is already done).

### 3. Scheduled Cleanup (`schedule` trigger)

Weekly (Sunday 04:00 UTC):

| Step | Purpose |
|---|---|
| `stale-peer-cleanup` | SSH into server or call health endpoint to log peer stats (informational only) |
| `dependency-audit` | `npm audit` — report vulnerabilities |

### 4. Optional: Dependency Updates (Dependabot / Renovate)

Enable Dependabot for weekly dependency update PRs:
- `package.json` (frontend)
- `server/package.json` (server)

Separate PR per update, auto-merge patch versions if CI passes.

## Technical Design

### Workflow File

`.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build
      # Optional: bundle-size check
      # - uses: actions/upload-artifact@v4
      #   with:
      #     name: dist
      #     path: dist/

  deploy:
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    needs: quality
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

`.github/workflows/schedule.yml`:

```yaml
name: Weekly Maintenance

on:
  schedule:
    - cron: '0 4 * * 0'

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm audit --audit-level=high
        continue-on-error: true
```

### Secrets Required

| Secret | Where Used | Purpose |
|---|---|---|
| `VERCEL_TOKEN` | deploy job | Vercel API authentication |
| `VERCEL_ORG_ID` | deploy job | Vercel organisation ID |
| `VERCEL_PROJECT_ID` | deploy job | Vercel project ID |

### Branch Protection Rules (GitHub)

To be configured on the `main` branch:

- ☑ Require pull request reviews (1 reviewer minimum)
- ☑ Require status checks to pass before merging
  - Status check: `quality / lint`, `quality / test`, `quality / build`
- ☑ Require branches to be up-to-date before merging
- ☑ Do not allow bypassing the above settings

### Vercel Configuration

The existing Vercel auto-deploy from the Git integration should be replaced by the GitHub Actions deploy step, or left as-is with the CI workflow running in parallel. The safest approach is to **keep Vercel auto-deploy** (it's already working) and add CI checks as a non-blocking parallel pipeline initially, then make them blocking once proven stable.

### Local Pre-commit Hook (Optional)

Add `husky` + `lint-staged` for pre-commit type checking:

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["tsc --noEmit"]
  }
}
```

This is optional — only add if the team agrees to the workflow overhead.

## Files to Create

- `.github/workflows/ci.yml`
- `.github/workflows/schedule.yml`
- `.github/dependabot.yml` (optional)

## Files to Modify

- (none — no source changes needed)

## Acceptance Criteria

- [ ] PR to main triggers lint → test → build in CI
- [ ] Push to main runs full pipeline and deploys to Vercel on success
- [ ] CI failure blocks merge (via branch protection)
- [ ] Weekly `npm audit` runs automatically
- [ ] Full pipeline completes in <3 minutes
- [ ] Zero changes to application code
