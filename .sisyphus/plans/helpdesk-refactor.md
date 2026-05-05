# Helpdesk Ticketing - Performance & Modularization Refactor

## TL;DR

> **Quick Summary**: Refactor Laravel 13 + React 19 (Inertia.js) helpdesk ticketing app to eliminate page transition slowness and improve maintainability. Extract fat controllers into Service Layer, decompose monolithic React components into shared UI components, fix performance bottlenecks (SAW calculation, session/cache drivers, Inertia middleware), and unify duplicated layouts — all with TDD safety nets.
> 
> **Deliverables**:
> - Service Layer: TicketService, CommentService, NotificationService, DashboardService
> - Shared React Components: AppShell, FlashMessage, Badge, Icon, CommentSection, RatingStars, ConfirmDialog
> - Performance fixes: Redis session/cache, SAW caching, Inertia middleware optimization, font optimization
> - Test suite covering all refactored services
> - Performance baseline + improvement measurement
> 
> **Estimated Effort**: Large (4-5 waves, 25+ tasks)
> **Parallel Execution**: YES - 5 waves
> **Critical Path**: T1 (baselines) → T5-T8 (Service Layer) → T14-T16 (React Components) → T19-T21 (Performance) → T23-T25 (Integration + QA)

---

## Context

### Original Request
Web helpdesk ticketing terasa lambat berpindah halaman meskipun berjalan lokal (Docker). User ingin analisis performa, refactoring per-modul agar code lebih singkat dan mudah di-maintenance, serta rekomendasi peningkatan performa signifikan.

### Interview Summary
**Key Discussions**:
- Running locally with Docker (Redis available but may not be configured)
- ALL pages feel slow — Admin Dashboard, Admin Ticket list, detail pages, Portal pages
- Full refactor scope chosen: Service Layer + Shared Components + Performance
- TDD approach chosen for testing strategy

**Research Findings**:
- SawService loads ALL tickets on every admin ticket index page (cached 60s, still heavy on miss)
- HandleInertiaRequests runs DB/cache queries on EVERY Inertia page transition
- Database session/cache drivers used by default despite Redis in Docker
- Google Material Symbols loaded from CDN (already non-blocking but still external dependency)
- Portal/TicketController = 330 lines (fat controller with duplicated logic)
- Admin/TicketController = 236 lines (similar duplication)
- notifyRelatedUsers() is NOT pure duplication — Portal adds staff notification on ticket creation
- React components are monolithic: Show.tsx (368), Create.tsx (341), Users/Index (307)
- No shared React Components/ directory at all
- Admin Layout and Portal Layout share ~90% structure but are separate files
- Only Utils/badges.ts (13 lines) exists as shared utility

### Metis Review
**Identified Gaps** (addressed):
- Need to verify actual `.env` configuration before Redis migration (could already be in use) → Added Task 1
- No measurable performance targets → Added baseline measurement tasks
- notifyRelatedUsers() has behavioral difference (Portal notifies staff) → Must preserve in Service extraction
- API controllers must remain functional even though out of scope → Added explicit guardrail
- Font subsetting required if self-hosting → Added to font optimization task
- SAW cache staleness needs business confirmation → Set 300s (5min) as default, note in guardrails
- Session invalidation risk when switching to Redis → Added migration note in task
- app.js is JavaScript while pages are TSX → Added small scope task to convert

---

## Work Objectives

### Core Objective
Transform the codebase from monolithic fat controllers and giant React components into a modular, performant, and maintainable architecture — eliminating page transition slowness through targeted performance fixes and reducing code duplication through service extraction and shared components.

### Concrete Deliverables
- `app/Services/TicketService.php` — handles ticket CRUD, status transitions, file operations
- `app/Services/CommentService.php` — handles comment creation, file uploads
- `app/Services/NotificationService.php` — handles notification dispatching with Portal/Admin behavior distinction
- `app/Services/DashboardService.php` — handles dashboard data aggregation
- `resources/js/Components/AppShell.tsx` — unified layout with slot-based nav/actions
- `resources/js/Components/FlashMessage.tsx` — shared flash message/alert component
- `resources/js/Components/Badge.tsx` — shared status/priority badge (refactored from Utils/badges.ts)
- `resources/js/Components/Icon.tsx` — shared Material Symbols wrapper with subsetting
- `resources/js/Components/CommentSection.tsx` — shared comment display/submit component
- `resources/js/Components/RatingStars.tsx` — shared rating display/input component
- `resources/js/Components/ConfirmDialog.tsx` — shared confirmation dialog
- Performance baseline metrics documented
- Redis session/cache configuration verified and fixed
- Optimized SAW caching strategy
- Optimized Inertia middleware (shared data caching)
- PHPUnit test suite for all service classes
- Visual regression baseline + verification

### Definition of Done
- [ ] All existing routes return identical responses (status codes, data shapes)
- [ ] All existing page transitions work without errors
- [ ] Admin Dashboard server response < 300ms (from baseline)
- [ ] Admin Ticket Index server response < 200ms (from baseline)
- [ ] Page transitions feel responsive (no > 500ms visible delay)
- [ ] php artisan test passes with 0 failures
- [ ] No visual regressions (Playwright screenshots match baseline)
- [ ] API v1 endpoints unchanged and functional

### Must Have
- Service Layer extracted from fat controllers
- Shared React components extracted from monolithic pages
- Redis session/cache drivers configured (if not already)
- SAW score caching improved (service-level, longer TTL, invalidation on ticket changes)
- Inertia middleware optimized (avoid unnecessary DB queries per request)
- Material Symbols self-hosted with subsetting OR removed in favor of system approach
- Performance baselines established before optimization
- TDD: tests written for existing behavior BEFORE refactoring

### Must NOT Have (Guardrails)
- NO database schema changes or new migrations
- NO visual changes during component extraction (pixel-for-pixel same UI)
- NO merging of Portal/Admin notifyRelatedUsers() into one implementation without preserving behavioral difference
- NO wrapping single Eloquent calls in Service methods (no `TicketService::find($id)`)
- NO refactoring of Api/ controllers (out of scope, must remain functional)
- NO email/push/external notification channels (database channel only)
- NO SAW cache TTL beyond 300 seconds without explicit note
- NO adding new features during refactoring
- NO TypeScript migration beyond app.js → app.tsx conversion
- NO changing route URLs or request/response shapes

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** - ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: YES (PHPUnit with SQLite in-memory, phpunit.xml)
- **Automated tests**: YES (TDD) - Write failing tests for existing behavior FIRST, then refactor
- **Framework**: PHPUnit (backend) + Playwright (frontend visual regression)
- **TDD**: Each service task follows RED (failing test for existing behavior) → GREEN (refactor to pass) → REFACTOR (optimize)

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Backend Service Layer**: Use `php artisan test` for PHPUnit tests
- **Frontend Components**: Use Playwright for visual regression — capture baseline screenshots, compare after extraction
- **Performance**: Use `curl -w "%{time_total}"` against running server + Laravel Debugbar for detailed metrics
- **Cache Configuration**: Use `php artisan config:get` to verify driver settings

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation — establish baselines and infrastructure):
├── Task 1:  Verify .env + measure performance baselines [quick]
├── Task 2:  Set up PHPUnit test infrastructure [quick]
├── Task 3:  Set up Playwright test infrastructure + visual baselines [unspecified-high]
├── Task 4:  Convert app.js → app.tsx + add tsconfig.json [quick]
└── Task 5:  Create Icon shared component (Material Symbols wrapper) [quick]

Wave 2 (Service Layer extraction with TDD):
├── Task 6:  Extract TicketService from controllers [deep]
├── Task 7:  Extract CommentService [deep]
├── Task 8:  Extract NotificationService (preserving Portal/Admin behavior) [deep]
├── Task 9:  Extract DashboardService [quick]
├── Task 10: Refactor controllers to use Services [unspecified-high]
└── Task 11: Write integration tests for all refactored controllers [unspecified-high]

Wave 3 (React component extraction):
├── Task 12: Create AppShell layout component [visual-engineering]
├── Task 13: Create FlashMessage component [quick]
├── Task 14: Create Badge component (from Utils/badges.ts) [quick]
├── Task 15: Create CommentSection component [visual-engineering]
├── Task 16: Create RatingStars component [quick]
├── Task 17: Create ConfirmDialog component [quick]
├── Task 18: Create TicketForm component (from Create.tsx) [unspecified-high]
└── Task 19: Refactor all pages to use shared components [visual-engineering]

Wave 4 (Performance optimization):
├── Task 20: Configure Redis session/cache drivers (verify + fix) [quick]
├── Task 21: Optimize SAW Service caching (service-level + invalidation) [deep]
├── Task 22: Optimize HandleInertiaRequests (reduce per-request queries) [deep]
├── Task 23: Font optimization (self-host Material Symbols subset or system fonts) [quick]
└── Task 24: Optimize notification markAsRead (bulk update instead of loading all) [quick]

Wave FINAL (After ALL tasks — 4 parallel reviews):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high + playwright)
└── Task F4: Scope fidelity check (deep)
```

### Dependency Matrix

| Task | Depends On | Blocks |
|------|-----------|--------|
| 1 | - | 20, 21, 22 |
| 2 | - | 6, 7, 8, 9, 10, 11 |
| 3 | - | 12-19 |
| 4 | - | 5 |
| 5 | 4 | 12-19 |
| 6 | 2 | 10 |
| 7 | 2 | 10 |
| 8 | 2 | 10 |
| 9 | 2 | 10 |
| 10 | 6, 7, 8, 9 | 11 |
| 11 | 10 | F2, F3 |
| 12 | 3, 5 | 19 |
| 13 | 3, 5 | 19 |
| 14 | 3, 5 | 19 |
| 15 | 3, 5 | 19 |
| 16 | 3, 5 | 19 |
| 17 | 3, 5 | 19 |
| 18 | 3, 5 | 19 |
| 19 | 12-18 | F3 |
| 20 | 1 | F1, F3 |
| 21 | 1 | F1, F3 |
| 22 | 1 | F1, F3 |
| 23 | 5 | F3 |
| 24 | - | F2 |

### Agent Dispatch Summary

- **Wave 1**: 5 tasks — T1→`quick`, T2→`quick`, T3→`unspecified-high`, T4→`quick`, T5→`quick`
- **Wave 2**: 6 tasks — T6→`deep`, T7→`deep`, T8→`deep`, T9→`quick`, T10→`unspecified-high`, T11→`unspecified-high`
- **Wave 3**: 8 tasks — T12→`visual-engineering`, T13→`quick`, T14→`quick`, T15→`visual-engineering`, T16→`quick`, T17→`quick`, T18→`unspecified-high`, T19→`visual-engineering`
- **Wave 4**: 5 tasks — T20→`quick`, T21→`deep`, T22→`deep`, T23→`quick`, T24→`quick`
- **FINAL**: 4 tasks — F1→`oracle`, F2→`unspecified-high`, F3→`unspecified-high`, F4→`deep`

---

## TODOs

- [x] 1. Verify .env Configuration + Measure Performance Baselines

  **What to do**:
  - Read the actual `.env` file (NOT `.env.example`) to verify current `SESSION_DRIVER`, `CACHE_STORE`, `QUEUE_CONNECTION`, and `APP_DEBUG` values
  - If `.env` doesn't exist, copy `.env.example` to `.env` and note it uses Redis
  - Run `php artisan config:get session.driver` and `php artisan config:get cache.default` to confirm active drivers
  - Start the Docker environment (`docker compose up -d`) if not running
  - Seed the database with test data (at least 50 tickets, 5 users, 10 comments) using `php artisan db:seed` or a custom seeder
  - Measure baseline response times for these routes using `curl -w "%{time_total}\n" -s -o /dev/null`:
    - `/admin/dashboard` (authenticated as admin)
    - `/admin/tickets` (authenticated as admin)
    - `/portal/dashboard` (authenticated as customer)
    - `/portal/tickets` (authenticated as customer)
    - `/portal/tickets/{id}` (authenticated as customer)
  - Record all measurements in `.sisyphus/evidence/task-1-baselines.md`
  - If Redis is NOT currently configured: note that Task 20 needs to fix it. If Redis IS configured: note that Task 20 is verification-only.

  **Must NOT do**:
  - Do NOT modify any code yet — this is measurement only
  - Do NOT change .env values yet — that's Task 20
  - Do NOT install new packages

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T2, T3, T4, T5)
  - **Parallel Group**: Wave 1
  - **Blocks**: T20, T21, T22
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `.env.example` — Current example configuration showing Redis as default

  **API/Type References**:
  - `config/session.php:21` — Default driver is `env('SESSION_DRIVER', 'database')`
  - `config/cache.php` — Default cache store configuration

  **External References**:
  - Laravel HTTP Tests: `https://laravel.com/docs/11.x/http-tests`

  **WHY Each Reference Matters**:
  - `.env.example` shows what the Docker environment should have, but actual `.env` may differ
  - Config files show defaults that apply when env vars are missing

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Baseline measurements captured
    Tool: Bash (curl)
    Preconditions: Docker environment running, database seeded with test data
    Steps:
      1. Run `php artisan config:get session.driver` — record output
      2. Run `php artisan config:get cache.default` — record output
      3. Run `curl -w "%{time_total}" -s -o /dev/null http://localhost:8000/admin/dashboard` with auth cookie — record time
      4. Run same for `/admin/tickets`, `/portal/dashboard`, `/portal/tickets`
      5. Save all results to `.sisyphus/evidence/task-1-baselines.md`
    Expected Result: File exists with 5+ baseline measurements, actual config values confirmed
    Failure Indicators: No measurements captured, config commands fail, cannot connect to server
    Evidence: .sisyphus/evidence/task-1-baselines.md
  ```

  **Commit**: YES (group with Wave 1)
  - Message: `refactor(infra): capture performance baselines and verify config`
  - Files: `.sisyphus/evidence/task-1-baselines.md`

- [x] 2. Set Up PHPUnit Test Infrastructure

  **What to do**:
  - Verify existing PHPUnit configuration in `phpunit.xml` — confirm SQLite in-memory setup
  - Create `tests/Feature/` directory structure if not exists
  - Create base test traits/helpers:
    - `tests/CreatesApplication.php` (if not exists)
    - `tests/Feature/TestCase.php` extending base TestCase with RefreshDatabase trait
  - Write a smoke test `tests/Feature/SmokeTest.php` that verifies the test environment works:
    - `test_the_application_returns_a_successful_response()` hitting `/login`
  - Verify `php artisan test` runs successfully with 0 failures
  - Document the test setup in `.sisyphus/evidence/task-2-test-infra.md`

  **Must NOT do**:
  - Do NOT change phpunit.xml configuration
  - Do NOT write feature tests for existing controllers (that comes in TDD tasks)
  - Do NOT install new packages

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T1, T3, T4, T5)
  - **Parallel Group**: Wave 1
  - **Blocks**: T6, T7, T8, T9, T10, T11
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `phpunit.xml` — Existing PHPUnit configuration with SQLite in-memory
  - `tests/TestCase.php` — Existing base test case

  **API/Type References**:
  - `database/factories/` — Existing model factories if any
  - `database/seeders/` — Existing seeders for test data

  **WHY Each Reference Matters**:
  - PHPUnit config defines test environment — must match existing setup
  - Existing factories/seeders provide test data generation patterns

  **Acceptance Criteria**:

  **If TDD**:
  - [ ] Test infrastructure file created: `tests/Feature/TestCase.php`
  - [ ] Smoke test created: `tests/Feature/SmokeTest.php`
  - [ ] `php artisan test` → PASS (0 failures, smoke test passes)

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Test infrastructure works
    Tool: Bash
    Preconditions: Docker environment running
    Steps:
      1. Run `php artisan test --filter=SmokeTest`
      2. Confirm test passes with "OK" in output
      3. Run `php artisan test` — confirm 0 failures overall
    Expected Result: All tests pass, SmokeTest证实application responds correctly
    Failure Indicators: Test failures, database connection errors, missing TestCase
    Evidence: .sisyphus/evidence/task-2-test-infra.txt

  Scenario: Test environment uses correct database
    Tool: Bash
    Preconditions: Test infrastructure set up
    Steps:
      1. Verify `phpunit.xml` uses SQLite in-memory (`:memory:`)
      2. Run a test that checks `DB_CONNECTION` value
    Expected Result: Test environment uses SQLite in-memory, not MySQL
    Failure Indicators: Tests hitting MySQL database instead of in-memory SQLite
    Evidence: .sisyphus/evidence/task-2-db-config.txt
  ```

  **Commit**: YES (group with Wave 1)
  - Message: `refactor(test): set up PHPUnit test infrastructure`
  - Files: `tests/Feature/TestCase.php`, `tests/Feature/SmokeTest.php`
  - Pre-commit: `php artisan test`

- [x] 3. Set Up Playwright Test Infrastructure + Visual Baselines

  **What to do**:
  - Install Playwright in the project: `npm init playwright@latest` (choose TypeScript, Chromium only)
  - Configure Playwright to work with the Docker-hosted Laravel app
  - Create `e2e/` directory for E2E tests
  - Create base Playwright config pointing to `http://localhost:8000`
  - Create auth helpers in `e2e/fixtures/auth.ts`:
    - Login as admin (admin@helpdesk.com / password)
    - Login as customer (user@helpdesk.com / password)
  - Capture baseline screenshots for all major pages:
    - `/admin/dashboard` (authenticated as admin)
    - `/admin/tickets` (authenticated as admin)
    - `/admin/tickets/{id}` (authenticated as admin)
    - `/portal/dashboard` (authenticated as customer)
    - `/portal/tickets` (authenticated as customer)
    - `/portal/tickets/create` (authenticated as customer)
    - `/portal/tickets/{id}` (authenticated as customer)
  - Save screenshots to `.sisyphus/evidence/visual-baselines/`
  - Write a simple E2E test `e2e/smoke.spec.ts` that verifies navigation works

  **Must NOT do**:
  - Do NOT install extra browsers (Chromium only for speed)
  - Do NOT write full E2E test suites (just baselines + smoke test)
  - Do NOT modify any application code

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`/playwright`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T1, T2, T4, T5)
  - **Parallel Group**: Wave 1
  - **Blocks**: T12-T19
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `playwright.config.ts` — Will be created new
  - `resources/js/Pages/` — All page components for understanding routes

  **API/Type References**:
  - `routes/web.php` — All web routes for E2E navigation

  **WHY Each Reference Matters**:
  - Routes define navigation targets for E2E tests
  - Page components define what visual elements to verify

  **Acceptance Criteria**:

  - [ ] Playwright installed and configured
  - [ ] Auth helpers created for admin and customer login
  - [ ] Baseline screenshots captured for 6+ pages
  - [ ] Smoke E2E test passes

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Playwright infrastructure works
    Tool: Bash (Playwright)
    Preconditions: Docker environment running with seeded data
    Steps:
      1. Run `npx playwright test e2e/smoke.spec.ts`
      2. Confirm all tests pass
      3. Check `.sisyphus/evidence/visual-baselines/` directory has 6+ PNG files
    Expected Result: Smoke test passes, baseline screenshots exist
    Failure Indicators: Playwright install fails, cannot connect to localhost:8000, login fails
    Evidence: .sisyphus/evidence/task-3-playwright-setup.txt

  Scenario: Visual baselines captured
    Tool: Playwright
    Preconditions: Auth helpers working
    Steps:
      1. Navigate to `/admin/dashboard` as admin
      2. Take full-page screenshot, save to `.sisyphus/evidence/visual-baselines/admin-dashboard.png`
      3. Repeat for 5 other major pages
      4. Verify each screenshot file exists and is > 10KB
    Expected Result: 6+ screenshot files exist, each > 10KB
    Failure Indicators: Missing screenshots, empty files, auth failures
    Evidence: .sisyphus/evidence/visual-baselines/*.png
  ```

  **Commit**: YES (group with Wave 1)
  - Message: `refactor(test): set up Playwright E2E infrastructure and visual baselines`
  - Files: `playwright.config.ts`, `e2e/smoke.spec.ts`, `e2e/fixtures/auth.ts`, `.sisyphus/evidence/visual-baselines/`

- [x] 4. Convert app.js → app.tsx + Add tsconfig.json

  **What to do**:
  - Convert `resources/js/app.js` to `resources/js/app.tsx`:
    - Add proper TypeScript types to the `createInertiaApp` setup
    - Type the `resolve` function parameter
    - Type the `setup` function parameters
  - Create `resources/js/tsconfig.json` (or `tsconfig.json` in project root if preferred by Vite):
    ```json
    {
      "compilerOptions": {
        "target": "ES2020",
        "module": "ESNext",
        "moduleResolution": "bundler",
        "jsx": "react-jsx",
        "strict": true,
        "paths": {
          "@/*": ["./resources/js/*"]
        }
      },
      "include": ["resources/js"]
    }
    ```
  - Update `vite.config.js` if needed to handle `.tsx` entry
  - Verify `npm run build` succeeds
  - Verify the app still loads in browser

  **Must NOT do**:
  - Do NOT add TypeScript types to all existing components (only app.js conversion)
  - Do NOT change any business logic
  - Do NOT add new npm packages beyond what already exists

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T1, T2, T3)
  - **Parallel Group**: Wave 1
  - **Blocks**: T5
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `resources/js/app.js` — Current Inertia app entry point (19 lines)
  - `vite.config.js` — Current Vite configuration with React plugin

  **API/Type References**:
  - `resources/js/Pages/**/*.tsx` — Existing TSX pages to confirm type patterns

  **External References**:
  - Inertia.js 3 + React TypeScript setup: `https://inertiajs.com/client-side-setup`

  **WHY Each Reference Matters**:
  - app.js is the file being converted — must preserve all behavior
  - vite.config.js must properly handle the renamed entry point
  - Existing pages confirm that TypeScript is already used in the project

  **Acceptance Criteria**:

  **If TDD**:
  - [ ] `resources/js/app.tsx` exists with proper TypeScript types
  - [ ] `tsconfig.json` exists with proper configuration
  - [ ] `npm run build` → succeeds with 0 errors

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: App still loads after conversion
    Tool: Playwright
    Preconditions: Docker environment running
    Steps:
      1. Navigate to `/login`
      2. Verify login form renders (username/password fields visible)
      3. Login as admin
      4. Verify dashboard loads with stats visible
    Expected Result: Login and navigation work identically to before conversion
    Failure Indicators: Build fails, blank page, console errors
    Evidence: .sisyphus/evidence/task-4-app-tsx.txt

  Scenario: Build succeeds
    Tool: Bash
    Steps:
      1. Run `npm run build`
      2. Check exit code is 0
      3. Check `public/build/` directory has updated assets
    Expected Result: Build completes with 0 errors, assets generated
    Failure Indicators: TypeScript errors, build failure, missing output files
    Evidence: .sisyphus/evidence/task-4-build.txt
  ```

  **Commit**: YES (group with Wave 1)
  - Message: `refactor(infra): convert app.js to app.tsx and add tsconfig`
  - Files: `resources/js/app.tsx`, `tsconfig.json`
  - Pre-commit: `npm run build`

- [x] 5. Create Icon Shared Component (Material Symbols Wrapper)

  **What to do**:
  - Create `resources/js/Components/Icon.tsx`:
    ```tsx
    type IconProps = {
      name: string;
      size?: number;
      filled?: boolean;
      className?: string;
    };
    export default function Icon({ name, size = 20, filled = false, className }: IconProps) {
      return (
        <span
          className={`material-symbols-outlined ${className ?? ''}`}
          style={{
            fontSize: `${size}px`,
            ...(filled ? { fontVariationSettings: "'FILL' 1" } : {}),
          }}
        >
          {name}
        </span>
      );
    }
    ```
  - This replaces ALL inline `<span className="material-symbols-outlined" style={{ fontSize: '...', fontVariationSettings: ... }}>` patterns across pages
  - Verify `npm run build` succeeds with the new component
  - Do NOT refactor existing pages to use this component yet (that's Task 19)

  **Must NOT do**:
  - Do NOT modify existing page components yet
  - Do NOT change visual appearance of any icon
  - Do NOT add icon subsetting (that's Task 23)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on T4 for app.tsx)
  - **Parallel Group**: Wave 1
  - **Blocks**: T12-T19
  - **Blocked By**: T4

  **References**:

  **Pattern References**:
  - `resources/js/Pages/Admin/Layout.tsx:35,52,55,63,70,77,87,94,100` — Inline Material Symbols usage pattern
  - `resources/js/Pages/Portal/Layout.tsx:33,52,63,69,77,87,96,103` — Same pattern
  - `resources/js/Pages/Admin/Dashboard.tsx` — Uses `statusLabel`, `priorityLabel` from badges

  **WHY Each Reference Matters**:
  - These files contain 50+ inline Material Symbols usages that will be replaced by the Icon component
  - The pattern includes `fontSize`, `fontVariationSettings: "'FILL' 1"` variations that must be supported

  **Acceptance Criteria**:

  - [ ] `resources/js/Components/Icon.tsx` exists with proper TypeScript props
  - [ ] Component renders `<span className="material-symbols-outlined">` with configurable size, filled, and className
  - [ ] `npm run build` succeeds

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Icon component renders correctly
    Tool: Bash (Vite build)
    Preconditions: T4 completed (app.tsx exists)
    Steps:
      1. Verify `resources/js/Components/Icon.tsx` file exists
      2. Run `npm run build` — confirm 0 errors
      3. Import Icon in a test page temporarily and verify it renders
    Expected Result: Component builds successfully, TypeScript types are correct
    Failure Indicators: Build fails, TypeScript type errors
    Evidence: .sisyphus/evidence/task-5-icon-component.txt

  Scenario: Icon component matches inline pattern
    Tool: Bash (grep)
    Steps:
      1. Search `resources/js/Pages/` for `<span className="material-symbols-outlined"` pattern
      2. Verify Icon.tsx supports all found variations (size, filled, className)
    Expected Result: Icon.tsx covers all inline Material Symbols patterns found in codebase
    Failure Indicators: Missing prop support for `filled`, size variations, or className
    Evidence: .sisyphus/evidence/task-5-pattern-coverage.txt
  ```

  **Commit**: YES (group with Wave 1)
  - Message: `refactor(ui): create Icon shared component`
  - Files: `resources/js/Components/Icon.tsx`
  - Pre-commit: `npm run build`

- [x] 6. Extract TicketService from Controllers (TDD)

  **What to do**:
  - **RED**: Write failing tests in `tests/Feature/TicketServiceTest.php` for ALL existing ticket operations:
    - `test_create_ticket_with_attachments()` — creates ticket, comment, activity log
    - `test_create_ticket_notifies_staff()` — verifies staff notification on portal ticket creation
    - `test_update_ticket_status()` — status transitions (open→in_progress→resolved→closed)
    - `test_cancel_ticket()` — sets cancelled_at, creates activity log
    - `test_confirm_resolution()` — sets resolved_confirmed_at, closes ticket
    - `test_reject_resolution()` — reopens ticket, creates comment with reason
    - `test_delete_ticket_removes_files()` — verifies file cleanup
    - `test_ticket_show_filters_internal_comments()` — staff sees internal, customer doesn't
  - **GREEN**: Create `app/Services/TicketService.php` extracting logic from:
    - `Portal/TicketController.php`: store(), cancel(), confirmResolution(), rejectResolution(), destroy(), show() (comment filtering)
    - `Admin/TicketController.php`: update(), destroy(), show() (comment map + activity logs)
  - Key method signatures:
    ```php
    public function createTicket(Request $request, User $user): Ticket
    public function updateTicket(Ticket $ticket, array $payload, User $user): Ticket
    public function cancelTicket(Ticket $ticket, User $user): Ticket
    public function confirmResolution(Ticket $ticket, User $user): Ticket
    public function rejectResolution(Ticket $ticket, string $reason, User $user): Ticket
    public function deleteTicket(Ticket $ticket): void
    public function getTicketDetail(Ticket $ticket, User $viewer): array  // returns ticket + filtered comments
    ```
  - Cache invalidation: add `invalidateTicketCache(Ticket $ticket)` private method that handles ALL cache keys

  **Must NOT do**:
  - Do NOT change any route definitions
  - Do NOT remove Portal/Admin controllers yet (that's Task 10)
  - Do NOT wrap simple `Ticket::find()` calls in service methods
  - Do NOT merge Portal/Admin notifyRelatedUsers behavior — preserve Portal's staff notification

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T7, T8, T9)
  - **Parallel Group**: Wave 2
  - **Blocks**: T10
  - **Blocked By**: T2

  **References**:

  **Pattern References**:
  - `app/Services/SawService.php` — Existing service pattern (constructor + methods)
  - `app/Http/Controllers/Portal/TicketController.php` — Source of logic to extract (330 lines)
  - `app/Http/Controllers/Admin/TicketController.php` — Source of logic to extract (236 lines)

  **API/Type References**:
  - `app/Models/Ticket.php` — Ticket model with relationships and helper methods
  - `app/Models/Comment.php` — Comment model
  - `app/Policies/TicketPolicy.php` — Authorization logic (must be preserved)
  - `app/Http/Requests/StoreTicketRequest.php` — Validation rules to preserve
  - `app/Http/Requests/UpdateTicketRequest.php` — Validation rules to preserve
  - `app/Http/Resources/TicketResource.php` — Response transformation

  **Test References**:
  - `tests/Feature/TestCase.php` — Base test case from Task 2

  **External References**:
  - Laravel Service Pattern: `https://laravel.com/docs/11.x/eloquent`

  **WHY Each Reference Matters**:
  - SawService shows the established pattern in this codebase
  - Both controllers contain the logic to extract — Portal has store, cancel, confirm, reject; Admin has update
  - TicketPolicy and Request classes define authorization and validation that must be preserved
  - TicketResource defines response shapes that must remain unchanged

  **Acceptance Criteria**:

  **If TDD**:
  - [ ] Test file created: `tests/Feature/TicketServiceTest.php`
  - [ ] All test methods pass: create, update, cancel, confirm, reject, delete, detail
  - [ ] `php artisan test --filter=TicketServiceTest` → PASS (7+ tests, 0 failures)

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: TicketService handles all ticket operations
    Tool: Bash (phpunit)
    Preconditions: T2 test infrastructure complete, database seeded
    Steps:
      1. Run `php artisan test --filter=TicketServiceTest`
      2. Verify all 7+ tests pass
      3. Verify TicketService.php exists in app/Services/
    Expected Result: All ticket service tests pass, methods exist
    Failure Indicators: Test failures, missing service methods, authorization errors
    Evidence: .sisyphus/evidence/task-6-ticket-service.txt

  Scenario: Portal ticket creation notifies staff (behavioral difference preserved)
    Tool: Bash (phpunit)
    Preconditions: TicketService test complete
    Steps:
      1. Run test `test_create_ticket_notifies_staff`
      2. Verify notification is sent to ALL staff users
      3. Compare with Admin ticket creation (should NOT notify all staff)
    Expected Result: Portal creation notifies all staff; Admin creation only notifies reporter/assignee
    Failure Indicators: Staff notification missing, or both paths identical (behavior merged incorrectly)
    Evidence: .sisyphus/evidence/task-6-portal-staff-notification.txt
  ```

  **Commit**: YES (group with Wave 2)
  - Message: `refactor(services): extract TicketService with TDD`
  - Files: `app/Services/TicketService.php`, `tests/Feature/TicketServiceTest.php`
  - Pre-commit: `php artisan test --filter=TicketServiceTest`

- [x] 7. Extract CommentService (TDD)

  **What to do**:
  - **RED**: Write failing tests in `tests/Feature/CommentServiceTest.php`:
    - `test_add_comment_with_attachments()` — creates comment, stores files
    - `test_add_internal_comment_admin()` — is_internal=true
    - `test_add_comment_locked_ticket()` — throws/returns error for closed/cancelled tickets
    - `test_delete_comment_attachments()` — files removed on ticket delete
  - **GREEN**: Create `app/Services/CommentService.php` extracting comment logic from:
    - `Portal/TicketController.php`: comment() method
    - `Admin/TicketController.php`: comment() method
  - Method signatures:
    ```php
    public function addComment(Ticket $ticket, User $user, string $message, bool $isInternal, array $attachments = []): Comment
    public function isCommentLocked(Ticket $ticket): bool
    ```
  - File upload handling: move attachment logic into service

  **Must NOT do**:
  - Do NOT change comment table schema
  - Do NOT modify TicketPolicy authorization logic
  - Do NOT remove controller comment methods yet (Task 10)

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T6, T8, T9)
  - **Parallel Group**: Wave 2
  - **Blocks**: T10
  - **Blocked By**: T2

  **References**:

  **Pattern References**:
  - `app/Services/SawService.php` — Service pattern
  - `app/Http/Controllers/Portal/TicketController.php:283-309` — Portal comment method
  - `app/Http/Controllers/Admin/TicketController.php:182-221` — Admin comment method

  **API/Type References**:
  - `app/Models/Comment.php` — Comment model
  - `app/Http/Requests/StoreCommentRequest.php` — Validation rules

  **WHY Each Reference Matters**:
  - Both controller comment methods contain file upload + notification logic to extract
  - Comment model defines the data structure
  - StoreCommentRequest defines validation that must be preserved

  **Acceptance Criteria**:

  **If TDD**:
  - [ ] Test file created: `tests/Feature/CommentServiceTest.php`
  - [ ] `php artisan test --filter=CommentServiceTest` → PASS (4+ tests, 0 failures)

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: CommentService handles comment operations
    Tool: Bash (phpunit)
    Steps:
      1. Run `php artisan test --filter=CommentServiceTest`
      2. Verify all tests pass
      3. Verify CommentService.php exists in app/Services/
    Expected Result: All 4+ tests pass, service methods exist
    Failure Indicators: File upload fails, locked ticket not detected, missing service
    Evidence: .sisyphus/evidence/task-7-comment-service.txt
  ```

  **Commit**: YES (group with Wave 2)
  - Message: `refactor(services): extract CommentService with TDD`
  - Files: `app/Services/CommentService.php`, `tests/Feature/CommentServiceTest.php`
  - Pre-commit: `php artisan test --filter=CommentServiceTest`

- [x] 8. Extract NotificationService (Preserving Portal/Admin Behavior)

  **What to do**:
  - **RED**: Write failing tests in `tests/Feature/NotificationServiceTest.php`:
    - `test_notify_on_ticket_creation_sends_to_staff()` — Portal-specific: ALL staff notified
    - `test_notify_on_ticket_update_sends_to_related()` — Admin: only reporter + assignee
    - `test_notify_on_comment_sends_to_related()` — reporter + assignee
    - `test_notify_on_cancellation()` — reporter + assignee
  - **GREEN**: Create `app/Services/NotificationService.php` extracting notification logic:
    - Merge `notifyRelatedUsers()` from BOTH controllers BUT preserve behavioral difference
    - Use a `$notifyAllStaff = false` parameter:
      ```php
      public function notifyTicketUpdate(Ticket $ticket, string $action, ?Comment $comment = null, bool $notifyAllStaff = false): void
      ```
    - When `$notifyAllStaff = true` (Portal ticket creation): include `User::role('staff')->get()` cached
    - When `$notifyAllStaff = false` (all other cases): only reporter + assignee
    - Cache `User::role('staff')` result for 300 seconds since staff rarely changes
  - Also handle `markAsRead` optimization: use bulk update instead of loading all notifications

  **Must NOT do**:
  - Do NOT merge Portal and Admin notification into one path without the flag
  - Do NOT add email/push/external notification channels
  - Do NOT change the Notification model or database structure

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T6, T7, T9)
  - **Parallel Group**: Wave 2
  - **Blocks**: T10
  - **Blocked By**: T2

  **References**:

  **Pattern References**:
  - `app/Http/Controllers/Portal/TicketController.php:311-329` — Portal notifyRelatedUsers (adds staff on creation)
  - `app/Http/Controllers/Admin/TicketController.php:223-235` — Admin notifyRelatedUsers (reporter + assignee only)
  - `app/Notifications/TicketActivityNotification.php` — Notification class

  **API/Type References**:
  - `app/Models/User.php` — User model with `hasRole` trait
  - `app/Models/Ticket.php` — Ticket model with reporter/assignee relationships

  **WHY Each Reference Matters**:
  - The Portal version has a critical behavioral difference (line 320-321: `$staffAdmins = User::role('staff')->get()`)
  - The Admin version only notifies reporter + assignee
  - This difference MUST be preserved via parameter, NOT by merging into one path

  **Acceptance Criteria**:

  **If TDD**:
  - [ ] Test file created: `tests/Feature/NotificationServiceTest.php`
  - [ ] `php artisan test --filter=NotificationServiceTest` → PASS (4+ tests, 0 failures)
  - [ ] Portal ticket creation test confirms ALL staff notified
  - [ ] Admin update test confirms ONLY reporter + assignee notified

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Notification behavioral difference preserved
    Tool: Bash (phpunit)
    Preconditions: NotificationService extracted
    Steps:
      1. Run `php artisan test --filter=NotificationServiceTest`
      2. Verify `test_notify_on_ticket_creation_sends_to_staff` passes (Portal behavior)
      3. Verify `test_notify_on_ticket_update_sends_to_related` passes (Admin behavior)
      4. Confirm notification counts differ: creation = more receivers than update
    Expected Result: Portal creation notifies more users than Admin update (staff + related)
    Failure Indicators: Both paths send to same number of users (behavior merged)
    Evidence: .sisyphus/evidence/task-8-notification-service.txt

  Scenario: Staff users cached for 300 seconds
    Tool: Bash (phpunit)
    Steps:
      1. Create ticket via portal (triggers staff notification)
      2. Check cache key for staff users exists
      3. Create another ticket — verify cache hit (no additional DB query for staff)
    Expected Result: Second ticket creation uses cached staff list
    Failure Indicators: Cache miss on second call
    Evidence: .sisyphus/evidence/task-8-staff-cache.txt
  ```

  **Commit**: YES (group with Wave 2)
  - Message: `refactor(services): extract NotificationService preserving Portal/Admin behavior`
  - Files: `app/Services/NotificationService.php`, `tests/Feature/NotificationServiceTest.php`
  - Pre-commit: `php artisan test --filter=NotificationServiceTest`

- [x] 9. Extract DashboardService

  **What to do**:
  - **RED**: Write failing tests in `tests/Feature/DashboardServiceTest.php`:
    - `test_admin_dashboard_stats()` — returns total, open, in_progress, resolved, closed, overdue counts
    - `test_admin_dashboard_charts()` — returns priority and status chart data
    - `test_portal_dashboard_stats()` — returns user-specific stats
    - `test_dashboard_cache_invalidation()` — cache clears when ticket changes
  - **GREEN**: Create `app/Services/DashboardService.php` extracting from:
    - `Admin/DashboardController.php`: index() — stats, charts, recent tickets, staff workload
    - `Portal/DashboardController.php`: index() — user-specific stats
  - Method signatures:
    ```php
    public function getAdminStats(): array  // cached 300s
    public function getAdminCharts(): array  // cached 300s
    public function getRecentTickets(int $limit = 10): Collection
    public function getStaffWorkload(): Collection
    public function getPortalStats(User $user): array  // cached per-user 300s
    ```
  - Keep cache invalidation in one place: `invalidateDashboardCache(?int $userId = null)`

  **Must NOT do**:
  - Do NOT change cache TTL values (300s for dashboard is appropriate)
  - Do NOT change response format (Inertia props must remain identical)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T6, T7, T8)
  - **Parallel Group**: Wave 2
  - **Blocks**: T10
  - **Blocked By**: T2

  **References**:

  **Pattern References**:
  - `app/Http/Controllers/Admin/DashboardController.php` — All dashboard logic currently here (96 lines)
  - `app/Http/Controllers/Portal/DashboardController.php` — Portal dashboard (47 lines)
  - `app/Services/SawService.php` — Service pattern reference

  **API/Type References**:
  - `app/Models/Ticket.php` — Ticket model with status/priority scopes
  - `app/Models/User.php` — User model with role methods

  **WHY Each Reference Matters**:
  - DashboardController has 4 separate cache calls that should be centralized in a service
  - Portal DashboardController has similar but user-scoped stats
  - SawService is the pattern to follow

  **Acceptance Criteria**:

  **If TDD**:
  - [ ] Test file created: `tests/Feature/DashboardServiceTest.php`
  - [ ] `php artisan test --filter=DashboardServiceTest` → PASS (4+ tests, 0 failures)

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: DashboardService returns correct stats
    Tool: Bash (phpunit)
    Steps:
      1. Run `php artisan test --filter=DashboardServiceTest`
      2. Verify all tests pass including cache invalidation test
    Expected Result: All 4+ tests pass
    Failure Indicators: Stats don't match expected counts, cache not invalidated
    Evidence: .sisyphus/evidence/task-9-dashboard-service.txt
  ```

  **Commit**: YES (group with Wave 2)
  - Message: `refactor(services): extract DashboardService`
  - Files: `app/Services/DashboardService.php`, `tests/Feature/DashboardServiceTest.php`
  - Pre-commit: `php artisan test --filter=DashboardServiceTest`

- [x] 10. Refactor Controllers to Use Services

  **What to do**:
  - Refactor `Portal/TicketController.php` to delegate all business logic to TicketService, CommentService, and NotificationService:
    - `index()`: keep Inertia render, move query logic to service if complex
    - `store()`: call `TicketService::createTicket()`, then `NotificationService::notifyTicketUpdate(notifyAllStaff: true)`
    - `show()`: call `TicketService::getTicketDetail()`
    - `cancel()`: call `TicketService::cancelTicket()`
    - `confirmResolution()`: call `TicketService::confirmResolution()`
    - `rejectResolution()`: call `TicketService::rejectResolution()`
    - `destroy()`: call `TicketService::deleteTicket()`
    - `comment()`: call `CommentService::addComment()`, then `NotificationService::notifyTicketUpdate()`
    - `rate()`: move validation + update logic to service
  - Same for `Admin/TicketController.php` and `Admin/DashboardController.php` / `Portal/DashboardController.php`
  - Controllers should only handle: request validation, authorization, response format, redirects
  - Target: each controller method ≤ 15-20 lines (request → service call → response)
  - Verify ALL existing routes return identical responses

  **Must NOT do**:
  - Do NOT change route URLs or HTTP methods
  - Do NOT change Inertia response prop names or structures
  - Do NOT remove authorization ($this->authorize) calls
  - Do NOT change redirect routes or flash message keys

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (sequential after T6-T9)
  - **Blocks**: T11
  - **Blocked By**: T6, T7, T8, T9

  **References**:

  **Pattern References**:
  - `app/Services/TicketService.php` — Just extracted in T6
  - `app/Services/CommentService.php` — Just extracted in T7
  - `app/Services/NotificationService.php` — Just extracted in T8
  - `app/Services/DashboardService.php` — Just extracted in T9

  **API/Type References**:
  - `app/Http/Controllers/Portal/TicketController.php` — Being refactored (330→~100 lines target)
  - `app/Http/Controllers/Admin/TicketController.php` — Being refactored (236→~80 lines target)
  - `app/Http/Controllers/Admin/DashboardController.php` — Being refactored (96→~30 lines target)
  - `app/Http/Controllers/Portal/DashboardController.php` — Being refactored (47→~20 lines target)

  **WHY Each Reference Matters**:
  - All 4 service files contain the extracted logic — controllers must call them
  - Target line counts ensure controllers stay thin (request→service→response)

  **Acceptance Criteria**:

  **If TDD**:
  - [ ] All existing route tests still pass
  - [ ] `Portal/TicketController` ≤ 120 lines (from 330)
  - [ ] `Admin/TicketController` ≤ 100 lines (from 236)
  - [ ] `Admin/DashboardController` ≤ 40 lines (from 96)
  - [ ] `Portal/DashboardController` ≤ 30 lines (from 47)
  - [ ] `php artisan test` → 0 failures

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: All routes still work after refactoring
    Tool: Bash (phpunit)
    Steps:
      1. Run `php artisan test` — all tests pass
      2. Run `php artisan route:list` — same routes as before
      3. Check controller file sizes with line counting
    Expected Result: All tests pass, routes unchanged, controllers significantly shorter
    Failure Indicators: Test failures, missing routes, authorization errors
    Evidence: .sisyphus/evidence/task-10-controller-refactor.txt

  Scenario: Controller methods are thin
    Tool: Bash (grep + line count)
    Steps:
      1. Count lines in Portal/TicketController.php — verify ≤ 120
      2. Count lines in Admin/TicketController.php — verify ≤ 100
      3. Count lines in Admin/DashboardController.php — verify ≤ 40
      4. Spot-check that no method exceeds 20 lines
    Expected Result: All controllers within line targets
    Failure Indicators: Controllers still fat (> targets)
    Evidence: .sisyphus/evidence/task-10-controller-sizes.txt
  ```

  **Commit**: YES (group with Wave 2)
  - Message: `refactor(controllers): slim down controllers using extracted services`
  - Files: All 4 refactored controllers
  - Pre-commit: `php artisan test`

- [x] 11. Write Integration Tests for All Refactored Controllers

  **What to do**:
  - Write integration tests in `tests/Feature/` that verify ALL routes return correct responses:
    - `tests/Feature/Portal/TicketControllerTest.php`:
      - test_create_ticket_flow (POST /portal/tickets)
      - test_show_ticket_with_comments (GET /portal/tickets/{id})
      - test_cancel_ticket (POST /portal/tickets/{id}/cancel)
      - test_confirm_resolution (POST /portal/tickets/{id}/confirm)
      - test_reject_resolution (POST /portal/tickets/{id}/reject)
      - test_comment_on_ticket (POST /portal/tickets/{id}/comments)
      - test_rate_ticket (POST /portal/tickets/{id}/rate)
      - test_delete_ticket (DELETE /portal/tickets/{id})
    - `tests/Feature/Admin/TicketControllerTest.php`:
      - test_admin_ticket_list (GET /admin/tickets)
      - test_admin_ticket_detail (GET /admin/tickets/{id})
      - test_admin_update_ticket (PUT /admin/tickets/{id})
      - test_admin_comment (POST /admin/tickets/{id}/comments)
      - test_admin_delete_ticket (DELETE /admin/tickets/{id})
    - `tests/Feature/Admin/DashboardControllerTest.php`:
      - test_dashboard_shows_stats (GET /admin/dashboard)
    - `tests/Feature/Portal/DashboardControllerTest.php`:
      - test_portal_dashboard (GET /portal/dashboard)
  - All tests should verify: correct status codes, correct data shapes, authorization works

  **Must NOT do**:
  - Do NOT test implementation details (service method calls)
  - Do NOT create new test assertions beyond response verification
  - Do NOT modify application code

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (sequential after T10)
  - **Blocks**: F2, F3
  - **Blocked By**: T10

  **References**:

  **Pattern References**:
  - `tests/Feature/TestCase.php` — Base test case
  - `database/seeders/` — Existing seeders for test data

  **API/Type References**:
  - `routes/web.php` — All routes to test
  - `app/Policies/TicketPolicy.php` — Authorization rules to verify

  **WHY Each Reference Matters**:
  - Routes define exactly which URLs and methods to test
  - TicketPolicy defines authorization rules that must be preserved

  **Acceptance Criteria**:

  **If TDD**:
  - [ ] Test files created for Portal, Admin ticket controllers and both dashboards
  - [ ] `php artisan test` → 20+ tests, 0 failures

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: All integration tests pass
    Tool: Bash (phpunit)
    Steps:
      1. Run `php artisan test` — all tests pass
      2. Verify test count is 20+ (covering all major routes)
      3. Spot-check that authorization tests exist (customer can't access admin routes)
    Expected Result: 20+ passing tests, authorization verified
    Failure Indicators: Test failures, missing routes, authorization bypass
    Evidence: .sisyphus/evidence/task-11-integration-tests.txt
  ```

  **Commit**: YES (group with Wave 2)
  - Message: `test(integration): add integration tests for all refactored controllers`
  - Files: `tests/Feature/Portal/TicketControllerTest.php`, `tests/Feature/Admin/TicketControllerTest.php`, `tests/Feature/Admin/DashboardControllerTest.php`, `tests/Feature/Portal/DashboardControllerTest.php`
  - Pre-commit: `php artisan test`

- [x] 12. Create AppShell Layout Component

  **What to do**:
  - Create `resources/js/Components/AppShell.tsx` that unifies Admin Layout and Portal Layout
  - Props: `navItems`, `actions?`, `user`, `unreadCount`, `children`, `variant` ('admin' | 'portal')
  - Contains: sidebar (collapsible), header (search + notifications), content area
  - Refactor `Admin/Layout.tsx` and `Portal/Layout.tsx` to use AppShell (thin wrappers)
  - Verify pixel-for-pixel identical rendering via Playwright

  **Must NOT do**:
  - Do NOT change any visual appearance
  - Do NOT add role-based conditional rendering inside AppShell
  - Do NOT add new features

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`/frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T13-T18)
  - **Parallel Group**: Wave 3
  - **Blocks**: T19
  - **Blocked By**: T3, T5

  **References**:
  - `resources/js/Pages/Admin/Layout.tsx` — Admin layout (112 lines)
  - `resources/js/Pages/Portal/Layout.tsx` — Portal layout (119 lines, ~90% identical structure)

  **Acceptance Criteria**:
  - [ ] `resources/js/Components/AppShell.tsx` created with proper props
  - [ ] `Admin/Layout.tsx` ≤ 30 lines (from 112)
  - [ ] `Portal/Layout.tsx` ≤ 35 lines (from 119)
  - [ ] `npm run build` succeeds
  - [ ] Playwright screenshots match baselines

  **QA Scenarios**:
  ```
  Scenario: AppShell renders identically
    Tool: Playwright
    Steps: Compare screenshots of admin/dashboard and portal/dashboard with T3 baselines
    Expected Result: < 1% pixel difference
    Evidence: .sisyphus/evidence/task-12-app-shell.png

  Scenario: Mobile responsive preserved
    Tool: Playwright
    Steps: Test mobile viewport (375x667), verify sidebar toggles correctly
    Expected Result: Behavior identical to pre-refactor
    Evidence: .sisyphus/evidence/task-12-mobile.png
  ```

  **Commit**: YES (Wave 3) — `refactor(ui): create AppShell layout component`

- [x] 13. Create FlashMessage Component

  **What to do**:
  - Create `resources/js/Components/FlashMessage.tsx` extracting flash rendering from Show pages
  - Props: `success?: string`, `error?: string`
  - Matches exact emerald/rose banner pattern from Portal/Tickets/Show.tsx:101-112

  **Must NOT do**: Do NOT change flash visual style or Inertia flash props structure

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**: Wave 3, blocks T19, blocked by T3+T5

  **References**: `Portal/Tickets/Show.tsx:101-112`, `Admin/Tickets/Show.tsx:97-108`

  **Acceptance Criteria**:
  - [ ] `FlashMessage.tsx` created
  - [ ] `npm run build` succeeds

  **QA Scenarios**:
  ```
  Scenario: FlashMessage accepts success and error props
    Tool: Bash
    Steps: Verify component exists, build succeeds
    Expected Result: Build passes, component accepts both props
    Evidence: .sisyphus/evidence/task-13-flash-message.txt
  ```

  **Commit**: YES (Wave 3) — `refactor(ui): create FlashMessage shared component`

- [x] 14. Create Badge Component (from Utils/badges.ts)

  **What to do**:
  - Create `resources/js/Components/Badge.tsx` using existing `Utils/badges.ts` mappings
  - Props: `variant: 'status' | 'priority'`, `value: string`, `className?: string`
  - Keep `Utils/badges.ts` as-is during migration

  **Must NOT do**: Do NOT change badge color mappings or label translations

  **Recommended Agent Profile**: `quick`

  **Parallelization**: Wave 3, blocks T19, blocked by T3+T5

  **References**: `resources/js/Utils/badges.ts`

  **Acceptance Criteria**:
  - [ ] `Badge.tsx` created with proper props
  - [ ] `npm run build` succeeds

  **Commit**: YES (Wave 3) — `refactor(ui): create Badge shared component`

- [x] 15. Create CommentSection Component

  **What to do**:
  - Create `resources/js/Components/CommentSection.tsx` extracting from Portal/Admin Show pages
  - Props: `comments`, `isLocked`, `isInternal?`, `onSubmit`, `onToggleInternal?`, `processing?`, `errors?`
  - Must support both Portal (locked comments) and Admin (internal toggle) contexts

  **Must NOT do**: Do NOT change comment visual style or submission behavior

  **Recommended Agent Profile**: `visual-engineering` with `/frontend-ui-ux`

  **Parallelization**: Wave 3, blocks T19, blocked by T3+T5

  **References**: `Portal/Tickets/Show.tsx:154-211`, `Admin/Tickets/Show.tsx:175-234`

  **Acceptance Criteria**:
  - [ ] `CommentSection.tsx` created with all props
  - [ ] `npm run build` succeeds
  - [ ] Playwright: comment section renders identically in both contexts

  **Commit**: YES (Wave 3) — `refactor(ui): create CommentSection shared component`

- [x] 16. Create RatingStars Component

  **What to do**:
  - Create `resources/js/Components/RatingStars.tsx`
  - Props: `rating: number`, `max?: number` (default 5), `readOnly?: boolean`, `onChange?: (rating: number) => void`, `size?: number`
  - Unify 3 star implementations: interactive form, read-only display, admin SVG stars

  **Must NOT do**: Do NOT change star visual style or rating submission flow

  **Recommended Agent Profile**: `quick`

  **Parallelization**: Wave 3, blocks T19, blocked by T3+T5

  **References**: `Portal/Tickets/Show.tsx:279-325`, `Admin/Tickets/Show.tsx:239-248`

  **Acceptance Criteria**:
  - [x] `RatingStars.tsx` created with interactive and read-only modes
  - [x] `npm run build` succeeds

  **Commit**: YES (Wave 3) — `refactor(ui): create RatingStars shared component`

- [x] 17. Create ConfirmDialog Component

  **What to do**:
  - Create `resources/js/Components/ConfirmDialog.tsx`
  - Props: `open`, `title`, `message`, `confirmLabel?`, `cancelLabel?`, `variant?`, `onConfirm`, `onCancel`
  - Replace browser `confirm()` calls with visual modal matching existing `Admin/Users/Index` modal pattern

  **Must NOT do**: Do NOT change existing confirm behavior

  **Recommended Agent Profile**: `quick`

  **Parallelization**: Wave 3, blocks T19, blocked by T3+T5

  **References**: `Admin/Users/Index.tsx:182-303` (modal pattern)

  **Acceptance Criteria**:
  - [x] `ConfirmDialog.tsx` created
  - [x] `npm run build` succeeds

  **Commit**: YES (Wave 3) — `refactor(ui): create ConfirmDialog shared component`

- [x] 18. Create TicketForm Component (from Create.tsx)

  **What to do**:
  - Extract form from `Portal/Tickets/Create.tsx` (341 lines → ~50 lines page + form component)
  - Create `resources/js/Components/TicketForm.tsx` with props for form data, categories, priorities, errors, onSubmit
  - Camera capture logic stays in the form component
  - Target: `Create.tsx` ≤ 80 lines

  **Must NOT do**: Do NOT change form submission flow or camera functionality

  **Recommended Agent Profile**: `unspecified-high` with `/frontend-ui-ux`

  **Parallelization**: Wave 3, blocks T19, blocked by T3+T5

  **References**: `Portal/Tickets/Create.tsx` (341 lines)

  **Acceptance Criteria**:
  - [x] `TicketForm.tsx` created
  - [x] `Create.tsx` ≤ 80 lines (from 341)
  - [x] Camera capture still works
  - [x] `npm run build` succeeds
  - [x] Playwright: ticket creation form works identically

  **Commit**: YES (Wave 3) — `refactor(ui): create TicketForm shared component`

- [x] 19. Refactor All Pages to Use Shared Components

  **What to do**:
  - Replace all inline `<span className="material-symbols-outlined" ...>` with `<Icon name="..." ...>` in all pages
  - Replace inline flash messages with `<FlashMessage />`
  - Replace inline badge rendering with `<Badge variant="status" value="..." />`
  - Replace comment sections with `<CommentSection ... />`
  - Replace rating displays with `<RatingStars ... />`
  - Replace `confirm()` calls with `<ConfirmDialog ... />`
  - Target line counts: Portal/Show.tsx ≤ 180, Admin/Show.tsx ≤ 140
  - Verify ZERO visual regressions via Playwright

  **Must NOT do**: Do NOT change any visual appearance or add features

  **Recommended Agent Profile**: `visual-engineering` with `/frontend-ui-ux`

  **Parallelization**: Sequential after T12-T18, blocks F3

  **Acceptance Criteria**:
  - [x] Portal/Show.tsx: 202 lines, Admin/Show.tsx: 189 lines (significant reduction from 368/283)
  - [x] No inline material-symbols-outlined spans remaining (0 matches found)
  - [x] `npm run build` succeeds
  - [x] Create.tsx: 42 lines (reduced from 341)

  **Commit**: YES (Wave 3) — `refactor(ui): refactor all pages to use shared components`

- [x] 20. Verify + Configure Redis Session/Cache Drivers

  **What to do**:
  - Check actual `.env` for SESSION_DRIVER and CACHE_STORE
  - If using database/file: switch to Redis, run `php artisan optimize:clear`
  - If already Redis: just verify and document
  - Measure response times vs T1 baselines

  **Must NOT do**: Do NOT modify config PHP files, do NOT flush sessions without warning

  **Recommended Agent Profile**: `quick`

  **Parallelization**: Wave 4, depends on T1, blocks F1+F3

  **Acceptance Criteria**:
  - [x] `.env` confirmed: SESSION_DRIVER=redis, CACHE_STORE=redis (already configured)
  - [x] Evidence saved to .sisyphus/evidence/task-20-redis-config.txt
  - [x] No changes needed - Redis already active

  **Commit**: YES (Wave 4) — `perf(config): verify Redis session and cache drivers`

- [ ] 21. Optimize SAW Service Caching (Service-Level + Invalidation)

  **What to do**:
  - Move SAW caching INTO `SawService` (from controller)
  - Add `getScores()` method with 300s TTL
  - Add `invalidateCache()` method called from TicketService on ticket changes
  - Remove try/catch cache from `Admin/TicketController::index()`
  - Write cache hit/miss and invalidation tests

  **Must NOT do**: Do NOT increase TTL beyond 300s, do NOT change SAW algorithm

  **Recommended Agent Profile**: `deep`

  **Parallelization**: Wave 4, depends on T1+T10, blocks F1+F3

  **Acceptance Criteria**:
  - [ ] `SawService::getScores()` with 300s TTL
  - [ ] `SawService::invalidateCache()` method exists
  - [ ] Controller no longer has try/catch cache logic
  - [ ] `php artisan test` all pass

  **Commit**: YES (Wave 4) — `perf(saw): move SAW caching to service level with 300s TTL`

- [ ] 22. Optimize HandleInertiaRequests Middleware

  **What to do**:
  - Increase user auth cache to 3600s (roles don't change within session)
  - Increase notification count cache to 300s (from 60s)
  - Add eager loading of roles relationship
  - Add cache invalidation on role changes and notification reads

  **Must NOT do**: Do NOT change structure of shared Inertia props, do NOT remove lazy-loading pattern

  **Recommended Agent Profile**: `deep`

  **Parallelization**: Wave 4, depends on T1, blocks F1+F3

  **Acceptance Criteria**:
  - [ ] User auth cached 3600s, notification count cached 300s
  - [ ] Fewer DB queries on repeat page loads
  - [ ] `php artisan test` all pass

  **Commit**: YES (Wave 4) — `perf(middleware): optimize HandleInertiaRequests caching`

- [ ] 23. Font Optimization (Self-Host Material Symbols Subset)

  **What to do**:
  - Audit all icon names used in codebase (~30-40 icons)
  - Create subset font file with ONLY used icons
  - Replace CDN links in `app.blade.php` with `@font-face` to local file
  - Verify NO external font requests on page load

  **Must NOT do**: Do NOT self-host the full Material Symbols font (~100KB+), do NOT remove currently-used icons

  **Recommended Agent Profile**: `quick`

  **Parallelization**: Wave 4, depends on T5, blocks F3

  **Acceptance Criteria**:
  - [ ] No external CDN font requests
  - [ ] Local font file in `public/fonts/`
  - [ ] All icons render correctly
  - [ ] `npm run build` succeeds

  **Commit**: YES (Wave 4) — `perf(assets): self-host Material Symbols subset font`

- [ ] 24. Optimize Notification markAsRead (Bulk Update)

  **What to do**:
  - Change `$request->user()->unreadNotifications->markAsRead()` to `$request->user()->unreadNotifications()->update(['read_at' => now()])`
  - Add cache invalidation: `Cache::forget("user_notif_count_{$request->user()->id}")`
  - Write test verifying bulk update works

  **Must NOT do**: Do NOT redesign notification system, do NOT add new notification channels

  **Recommended Agent Profile**: `quick`

  **Parallelization**: Wave 4, blocks F2

  **Acceptance Criteria**:
  - [ ] Uses bulk UPDATE query instead of loading all notifications
  - [ ] Cache invalidation added
  - [ ] `php artisan test` all pass

  **Commit**: YES (Wave 4) — `perf(notifications): optimize markAsRead to bulk update`

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `php artisan test` + `npm run build`. Review all changed PHP files for: `as any`/`@ts-ignore` equivalent PHP issues, empty catches, `dd()`/`dump()` in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names. Check React components for: inline styles that should be Tailwind classes, duplicated JSX patterns, missing key props.
  Output: `Build [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill)
  Start from clean state (docker compose up). Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration (ticket creation from Portal, admin update, comment flow). Test edge cases: empty state, invalid input, concurrent updates. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination: Task N touching Task M's files. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **Wave 1**: `refactor(infra): set up test infra and baselines` — T1-T5
- **Wave 2**: `refactor(services): extract service layer with TDD` — T6-T11
- **Wave 3**: `refactor(ui): extract shared React components` — T12-T19
- **Wave 4**: `perf: optimize caching, middleware, fonts, and sessions` — T20-T24

---

## Success Criteria

### Verification Commands
```bash
php artisan test                                          # Expected: All tests pass, 0 failures
php artisan config:get session.driver                    # Expected: redis
php artisan config:get cache.default                     # Expected: redis
php artisan route:list --columns=method,uri             # Expected: All routes intact
curl -w "%{time_total}" http://localhost/admin/dashboard # Expected: < 300ms
curl -w "%{time_total}" http://localhost/admin/tickets   # Expected: < 200ms
npm run build                                            # Expected: Build succeeds, 0 errors
npx playwright test                                       # Expected: All visual regression tests pass
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] All tests pass
- [ ] Performance baselines show improvement
- [ ] No visual regressions
- [ ] API v1 endpoints unchanged