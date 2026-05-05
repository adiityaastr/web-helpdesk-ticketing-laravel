# Playwright Visual Baselines Setup - Learnings

## Date: 2025-05-05

### Installation
- Playwright installed via npm: `npm install -D @playwright/test`
- Chromium browser installed: `npx playwright install chromium`
- Had to use `--legacy-peer-deps` due to Vite version conflicts in the project

### Configuration
- Created `playwright.config.ts` with Chromium-only configuration
- Base URL set to `http://localhost:8000`
- WebServer configured to auto-start Docker containers
- Screenshot, trace, and video recording enabled for debugging

### Fixtures
- Created `e2e/fixtures/auth.ts` with login helpers:
  - `loginAsAdmin()` - admin@helpdesk.com / password
  - `loginAsStaff()` - staff@helpdesk.com / password
  - `loginAsUser()` - user@helpdesk.com / password
  - `login(email, password)` - custom credentials

### Test Files Created
1. `e2e/smoke.spec.ts` - 7 smoke tests for basic navigation
2. `e2e/visual-baselines.spec.ts` - 8 visual baseline capture tests

### Scripts Added to package.json
- `npm run test:e2e` - Run all E2E tests
- `npm run test:e2e:ui` - Run tests with UI mode
- `npm run test:e2e:debug` - Run tests in debug mode
- `npm run test:e2e:baseline` - Run visual baseline captures

### Key Learnings
1. Import paths in TypeScript/Playwright must be relative to the test file location
2. The fixture pattern allows reusable authentication across tests
3. Playwright's webServer config can auto-start Docker but needs long timeout for initial build
4. Screenshots are saved with `fullPage: true` to capture entire page content

### Verification
All 15 tests listed successfully:
- 7 smoke tests (homepage, login, role-based access)
- 8 visual baseline captures (6 major pages + 2 additional)
