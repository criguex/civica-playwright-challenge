# 🔀 Migration guide

How to move this framework to a different target, CI, or execution environment.
The design goal throughout: **change configuration, not tests.**

## Point it at a different site / app

The Page Objects encode _semantics_, not IMDb specifics. To retarget:

1. Update `BASE_URL` (or a `TEST_ENV` entry in `src/config/testConfig.ts`).
2. Adjust the locators inside the Page Objects to the new app's roles/test-ids.
3. Tests and fixtures stay untouched — they depend on Page Object _methods_.

## Migrate from mock to live (or vice versa)

The mock vs. live choice is just which fixture a spec imports:

- `src/fixtures/mockFixtures.ts` → offline replica (auto-installs the router).
- `src/fixtures/pageFixtures.ts` → live backend.

Same Page Objects, same assertions. No test logic changes.

## Run in Docker (parity with CI)

Use Playwright's official image so browsers and OS match CI exactly — essential
for stable visual snapshots.

```bash
docker build -t civica-pw .
docker run --rm -v "$PWD":/work -w /work civica-pw npm test
```

See the repo [`Dockerfile`](../Dockerfile).

## Migrate to a cloud grid (BrowserStack / LambdaTest / Sauce)

Playwright connects to remote browsers over CDP/WebSocket:

```ts
// playwright.config.ts (per project)
use: {
  connectOptions: { wsEndpoint: process.env.GRID_WS_ENDPOINT },
}
```

Keep everything else identical; only the browser transport changes.

## Migrate the CI provider

The pipeline is four portable steps — install, install browsers, static checks,
run suites. Equivalents:

- **GitHub Actions** — [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) (included).
- **GitLab CI** — a job using `image: mcr.microsoft.com/playwright:v1.x` running
  `npm ci && npm run lint && npm test`.
- **Azure DevOps** — a `Node.js` task + `script: npm ci && npm test`; publish
  `test-results/junit.xml` with `PublishTestResults@2`.
- **Jenkins** — a `nodejs` stage running the same npm scripts; archive
  `playwright-report/`.

Because reporters emit **JUnit XML**, any CI's native test dashboard works with
zero glue code.

## Upgrade Playwright

```bash
npm i -D @playwright/test@latest && npx playwright install
```

Run `npm run test:all`; the mock suite is the deterministic regression gate that
tells you instantly whether an upgrade broke anything.
