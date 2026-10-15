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

Implemented in `tests/visual/pages.visual.spec.ts` (`npm run test:visual`). Baselines
live under `tests/visual/*-snapshots/*-linux.png`, generated inside the repo's
Docker image so they match CI pixel-for-pixel — see [MIGRATION.md](MIGRATION.md)
for the exact command. Playwright already scopes snapshot filenames per OS
(`-linux`/`-darwin`/`-win32`), so a baseline taken outside Docker on macOS or
Windows never gets picked up in CI; regenerate with
`npm run test:visual:update` inside the Docker container whenever a mock page
changes on purpose.

## Pre-commit quality gates (husky)

```bash
npm i -D husky lint-staged && npx husky init
echo "npx lint-staged" > .husky/pre-commit
```

`lint-staged` can run `eslint --fix` + `prettier --write` on staged files.

## API / contract layer

Implemented: `tests/api/movies.api.spec.ts` (`npm run test:api`) drives
Playwright's `request` fixture against an in-process mock backend
(`mocks/server/apiMockServer.ts`, started by `src/fixtures/apiFixtures.ts`).
`tests/api/movies.contract.spec.ts` (`npm run test:contract`) validates the
same responses against the zod schemas in `src/contracts/movieApiSchemas.ts`
via the `toMatchSchema` custom matcher — add a field to the API, add it to the
schema, and any response missing it fails loudly instead of being adapted
around.

## Mutant scenarios (learning coverage)

See [MUTATION-TESTING.md](MUTATION-TESTING.md) — add mutators or new golden
seeds to multiply coverage; the engine learns which mutants matter.
