# Light Bill Calculator

A private, mobile-first shared electricity bill calculator. Calculations and PNG generation run entirely in the browser; readings are never uploaded. The Go server embeds the compiled React application in one deployable binary.

## Prerequisites and local use

- Go 1.27 or newer
- Node.js 22 or newer
- pnpm 10

```sh
cd web
pnpm install --frozen-lockfile
pnpm dev
```

Vite normally opens at `http://localhost:5173`. To exercise the production path:

```sh
make build
./bin/light-bill
```

Open `http://localhost:8080`. Set `ADDR=127.0.0.1:9000` to change the listener.

## Test and build

```sh
make test
make build
cd web && pnpm exec playwright install chromium webkit
cd web && pnpm test:e2e
```

The browser binaries are an optional one-time download. The suite targets desktop Chromium, a mobile viewport, and WebKit.

## Accounting and privacy

Inputs remain decimal strings and are evaluated with `decimal.js`; money is converted to integer kobo using HALF_UP rounding. Each row's energy is rounded to kobo, then integer-kobo charges are added. Shared charges use largest-remainder allocation in stable row order, so allocations reconcile exactly. The default total is the sum of row values.

The optional nearest-₦100 policy is applied last to each unit's energy-plus-extras amount. Its pre-rounding total and adjustment remain visible. Payments never change the billed grand total.

For the supplied sample, exact decimal arithmetic gives `62.3 × 227.27 = 14,158.921`, displayed as ₦14,158.92. The specification's printed ₦14,159.921 figure is arithmetically ₦1 higher; the app preserves the stated tariff formula rather than introducing an unexplained charge.

Drafts use versioned localStorage key `light-bill:draft:v1`; corrupt or unfamiliar versions are ignored. Clear Draft removes only that key. There are no analytics, databases, accounts, or external APIs.

## Deploy without Docker

Run `make build`, copy `bin/light-bill` to a Linux host, and run it under systemd or a host process manager. Cross-compile with:

```sh
GOOS=linux GOARCH=amd64 go build -trimpath -o bin/light-bill-linux ./cmd/server
```

Place Caddy, nginx, or a managed host in front for TLS and proxy to `127.0.0.1:8080`. Use `GET /healthz` for health checks and preserve response caching headers. Hashed assets cache for one year while `index.html` stays fresh.

The financial engine is in `web/src/lib`; the Go host is in `internal/server`. Large images lower pixel density automatically to stay under roughly 28 megapixels. Printing uses the clean export layout and can be saved as PDF.
