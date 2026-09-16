# Playwright's official image pins the browser + OS so local runs match CI,
# which is essential for stable visual snapshots and reproducible results.
FROM mcr.microsoft.com/playwright:v1.63.0-noble

WORKDIR /work

# Install dependencies first for better layer caching.
COPY package.json package-lock.json ./
# Browsers ship with the base image; skip the postinstall download.
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
RUN npm ci --ignore-scripts

COPY . .

# Default: run the deterministic mock suite.
CMD ["npm", "test"]
