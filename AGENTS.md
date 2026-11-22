# Repository Guidelines

## Stack

ShopLedger uses Node.js with Express 4 and `body-parser`. The UI is plain HTML, CSS, and browser JavaScript in `public/`. The app stores its data in `data/db.json` through `lib/store.js`; there is no database server or frontend build system.

## Module Map

- `server.js` creates the Express app, serves `public/`, mounts API routers, and renders the invoice route.
- `routes/`: `orders.js` handles order listing, placement, and cancellation; `products.js` serves products and coupons; `customers.js` handles Khata settlements; `reports.js` serves dashboard, pricing preview, reconciliation, and export endpoints.
- `lib/`: `orders.js`, `inventory.js`, `pricing.js`, `tax.js`, `coupons.js`, and `ledger.js` implement sales and account logic; `invoice.js` renders invoices; `reports.js` builds report data; `dates.js` formats dates; `store.js` reads and writes JSON data.
- `config.js` contains port, shop, tax, inventory, and coupon settings. `data/db.json` contains the current application records.

## Commands

- `npm start` — run the app with `node server.js` (port 3000 unless `PORT` is set).
- `npm test` — currently exits with an error because no test suite is configured.

There are no build, lint, or formatting commands defined in `package.json`.

## Required Change Rules

- Before changing behavior, write characterization tests that capture the existing behavior being changed.
- Change only the module the ticket is about; avoid unrelated edits or refactoring.
- Tests must never read from or write to `data/db.json`. Use isolated test data instead.
- Do not add dependencies.
