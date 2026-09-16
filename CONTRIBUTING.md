# Contributing

Thanks for taking a look! This repo is a technical-challenge submission, but it
is structured like a real project — contributions and review are welcome.

## Setup

```bash
npm install        # installs deps + Chromium
npm test           # deterministic mock suite (should be green)
```

## Before you push

```bash
npm run lint       # ESLint (0 warnings policy)
npm run typecheck  # strict TypeScript
npm run format     # Prettier
npm run test:all   # mock + mutation + e2e (e2e skips behind the bot wall)
```

## Conventions

- **Locators:** semantic only — `getByRole` / `getByTestId` / `getByLabel` / …
  Never XPath or CSS. (See [ADR-0003](docs/adr/0003-locator-strategy.md).)
- **Naming:** `camelCase` files/variables/methods, `PascalCase` classes/types.
- **Page Objects:** one screen per class extending `BasePage`; shared widgets are
  components under `src/pages/components/`. Expose intent, hide interaction.
- **Tests:** reuse fixtures; tag with `@smoke` / `@a11y` / `@mutant` etc.
- **Docs:** record notable decisions as an ADR under `docs/adr/`.

## Project layout

See the [README](README.md#-project-structure) for the full tree and the
[growth](docs/GROWTH.md) / [migration](docs/MIGRATION.md) guides.
