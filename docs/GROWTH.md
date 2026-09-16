# 📈 How to grow this framework

This project is intentionally small but structured so that scaling it never
requires a rewrite. Each section below is an independent, incremental step.

## Add a new page or component

1. Create a class under `src/pages/` extending `BasePage` (or `src/pages/components/`
   for a shared widget).
2. Expose only semantic locators (`getByRole` / `getByTestId` / `getByLabel` / …).
3. Register it as a fixture in `src/fixtures/pageFixtures.ts`.
4. Every spec can now request it by name — no `new` calls, no wiring.

## Add a new flow / test

Drop a `*.spec.ts` under the relevant `tests/<project>/` folder and reuse the
existing Page Objects and fixtures. Tag it (`@smoke`, `@a11y`, `@mutant`, …) so
it can be selected with `--grep`.

## Add browsers / devices

Add project entries in `playwright.config.ts`:

```ts
{ name: 'firefox',       use: { ...devices['Desktop Firefox'] } },
{ name: 'webkit',        use: { ...devices['Desktop Safari'] } },
{ name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
```

## Add environments

`src/config/testConfig.ts` already resolves a base URL per `TEST_ENV`
(`prod` | `staging` | `dev`). Wire real URLs there and run:

```bash
TEST_ENV=staging npm test
BASE_URL=https://my-preview.example npm test   # explicit override wins
```

## Grow the mock catalogue

Add records to `mocks/data/movies.ts`. Templates, search, chart and tests pick
them up automatically — it is the single source of truth.

## Speed up at scale (sharding)

No code changes — Playwright shards across CI runners:

```bash
npx playwright test --shard=1/4
```

## Richer reporting (Allure)

```bash
npm i -D allure-playwright
# add ['allure-playwright'] to the reporter array in playwright.config.ts
```

Keeps history, trends and step-level detail across runs.

## Visual regression

Add snapshot assertions against the deterministic mock (stable pixels):

```ts
await expect(page).toHaveScreenshot('movie-details.png', { maxDiffPixelRatio: 0.01 });
```

Generate baselines in the **same OS as CI** (a Linux container) to avoid
cross-platform rendering diffs — see [MIGRATION.md](MIGRATION.md) for the Docker recipe.

## Pre-commit quality gates (husky)

```bash
npm i -D husky lint-staged && npx husky init
echo "npx lint-staged" > .husky/pre-commit
```

`lint-staged` can run `eslint --fix` + `prettier --write` on staged files.

## API / contract layer

Playwright's `request` fixture can validate IMDb's (or your app's) APIs beside
the UI tests, sharing the same config and reporters.

## Mutant scenarios (learning coverage)

See [MUTATION-TESTING.md](MUTATION-TESTING.md) — add mutators or new golden
seeds to multiply coverage; the engine learns which mutants matter.
