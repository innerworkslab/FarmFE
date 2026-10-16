
## Overview

TailAdmin provides essential UI components and layouts for building feature-rich, data-driven admin dashboards and control panels. It's built on:

- Next.js 15.x
- React 19
- TypeScript
- Tailwind CSS V4

### Quick Links
- [✨ Visit Website](https://tailadmin.com)
- [📄 Documentation](https://tailadmin.com/docs)
- [⬇️ Download](https://tailadmin.com/download)
- [🖌️ Figma Design File (Community Edition)](https://www.figma.com/community/file/1463141366275764364)
- [⚡ Get PRO Version](https://tailadmin.com/pricing)

### Demos
- [Free Version](https://nextjs-free-demo.tailadmin.com)
- [Pro Version](https://nextjs-demo.tailadmin.com)

### Other Versions
- [HTML Version](https://github.com/TailAdmin/tailadmin-free-tailwind-dashboard-template)
- [React Version](https://github.com/TailAdmin/free-react-tailwind-admin-dashboard)
- [Vue.js Version](https://github.com/TailAdmin/vue-tailwind-admin-dashboard)

## Installation

### Prerequisites
To get started with TailAdmin, ensure you have the following prerequisites installed and set up:

- Node.js 18.x or later (recommended to use Node.js 20.x or later)

### Cloning the Repository
Clone the repository using the following command:

```bash
git clone https://github.com/TailAdmin/free-nextjs-admin-dashboard.git
```

> Windows Users: place the repository near the root of your drive if you face issues while cloning.

1. Install dependencies:
    ```bash
    npm install
    # or
    yarn install
    ```
    > Use `--legacy-peer-deps` flag if you face peer-dependency error during installation.

2. Start the development server:
    ```bash
    npm run dev
    # or
    yarn dev
    ```

## Components

TailAdmin is a pre-designed starting point for building a web-based dashboard using Next.js and Tailwind CSS. The template includes:

- Sophisticated and accessible sidebar
- Data visualization components
- Profile management and custom 404 page
- Tables and Charts(Line and Bar)
- Authentication forms and input elements
- Alerts, Dropdowns, Modals, Buttons and more
- Can't forget Dark Mode 🕶️

All components are built with React and styled using Tailwind CSS for easy customization.

## Feature Comparison

### Free Version
- 1 Unique Dashboard
- 30+ dashboard components
- 50+ UI elements
- Basic Figma design files
- Community support

### Pro Version
- 5 Unique Dashboards: Analytics, Ecommerce, Marketing, CRM, Stocks (more coming soon)
- 400+ dashboard components and UI elements
- Complete Figma design file
- Email support

To learn more about pro version features and pricing, visit our [pricing page](https://tailadmin.com/pricing).

## Changelog

### Version 2.0.2 - [March 25, 2025]

- Upgraded to Next v15.2.3 for [CVE-2025-29927](https://nextjs.org/blog/cve-2025-29927) concerns
- Included overrides vectormap for packages to prevent peer dependency errors during installation.
- Migrated from react-flatpickr to flatpickr package for React 19 support

### Version 2.0.1 - [February 27, 2025]

#### Update Overview

- Upgraded to Tailwind CSS v4 for better performance and efficiency.
- Updated class usage to match the latest syntax and features.
- Replaced deprecated class and optimized styles.

#### Next Steps

- Run npm install or yarn install to update dependencies.
- Check for any style changes or compatibility issues.
- Refer to the Tailwind CSS v4 [Migration Guide](https://tailwindcss.com/docs/upgrade-guide) on this release. if needed.
- This update keeps the project up to date with the latest Tailwind improvements. 🚀

### v2.0.0 (February 2025)
A major update focused on Next.js 15 implementation and comprehensive redesign.

#### Major Improvements
- Complete redesign using Next.js 15 App Router and React Server Components
- Enhanced user interface with Next.js-optimized components
- Improved responsiveness and accessibility
- New features including collapsible sidebar, chat screens, and calendar
- Redesigned authentication using Next.js App Router and server actions
- Updated data visualization using ApexCharts for React

#### Breaking Changes

- Migrated from Next.js 14 to Next.js 15
- Chart components now use ApexCharts for React
- Authentication flow updated to use Server Actions and middleware

[Read more](https://tailadmin.com/docs/update-logs/nextjs) on this release.

#### Breaking Changes
- Migrated from Next.js 14 to Next.js 15
- Chart components now use ApexCharts for React
- Authentication flow updated to use Server Actions and middleware

### v1.3.4 (July 01, 2024)
- Fixed JSvectormap rendering issues

### v1.3.3 (June 20, 2024)
- Fixed build error related to Loader component

### v1.3.2 (June 19, 2024)
- Added ClickOutside component for dropdown menus
- Refactored sidebar components
- Updated Jsvectormap package

### v1.3.1 (Feb 12, 2024)
- Fixed layout naming consistency
- Updated styles

### v1.3.0 (Feb 05, 2024)
- Upgraded to Next.js 14
- Added Flatpickr integration
- Improved form elements
- Enhanced multiselect functionality
- Added default layout component

## License

TailAdmin Next.js Free Version is released under the MIT License.

## Support

If you find this project helpful, please consider giving it a star on GitHub. Your support helps us continue developing and maintaining this template.
# game-project-frontend-admin
# btlmsadmin

## PM farm change integration

The frontend uses the contracts in `FARM_CHANGE_HANDOFF.md` and
`Livestock ERP — PM Farm Changes.postman_collection.json`.

- Customer opening balances post to AR through customer creation. Supplier openings use
  an amount, debit/credit type, branch, and currency and post through supplier creation.
  Master edits omit opening fields to avoid replaying the initial posting.
- Suppliers save `types[]`, with a fallback for older scalar `type` responses.
  The supplier AP action shows currency balances and dated opening/adjustment entries.
- Customer **AR Adjustment** and supplier **AP Adjustment** actions post signed ledger
  corrections with a branch, reason, and retry-stable idempotency key. AP corrections
  also include currency. The response shows the saved entry and business date;
  supplier AP balances refresh automatically. Opening amounts remain unchanged.
- Food stock units are the base units; one purchase/conversion unit equals the
  configured number of base units. The request includes `base_uom_id` and
  `conversion_uom_id` alongside the existing stock/purchase fields.
- Farm and warehouse selectors load the branch-scoped `location-options` endpoints.
  The supplied API returns flat branch lists, so finer barn/pen or zone/rack relationships
  remain server-validated.
- Purchase invoice and receipt editors submit all added lines. Receipt items come from
  the selected invoice detail, display ordered/received/remaining quantities, and allow
  partial acceptance. Save rechecks the current remainder; confirmation posts stock.
- Invoice **AP / Pay** opens supplier payments for that branch and invoice. The cashbook
  selector uses the payment summary's `eligible_cashbooks`; invoice currency must be
  available before payment.
- Inventory and purchasing balance views send `from_date`, `to_date`, warehouse,
  item, location, and page filters and display the server's Opening/In/Out/Closing
  quantities in stock units, retaining separate lots and locations.

### Postman request coverage

All 12 requests in the PM Farm Changes collection have API and UI integrations:

| Method | Endpoint | UI entry point |
| --- | --- | --- |
| POST | `/setup/customers` | Customers → Add Customer → Opening Balance |
| POST | `/setup/suppliers` | Suppliers → Add Supplier → Types and opening fields |
| GET | `/setup/suppliers/{id}/payables` | Suppliers → Actions → AP |
| GET | `/setup/farm-information/location-options` | Farm Information → Add/Edit → Branch and location selectors |
| GET | `/setup/inventories/location-options` | Warehouses → Add/Edit → Branch and location selectors |
| POST | `/setup/foods` | Foods → Add → Base and conversion units |
| POST | `/purchasing/invoices` | Purchasing → Create Invoice → Add item, description and currency |
| GET | `/purchasing/invoices/{id}/payments` | Purchase invoice → AP / Pay |
| POST | `/purchasing/receipts` | Purchase Receipts → Create → Select invoice items and partial quantities |
| POST | `/setup/customers/{id}/receivables/adjustments` | Customers → Actions → AR Adjustment |
| POST | `/setup/suppliers/{id}/payables/adjustments` | Suppliers → Actions → AP Adjustment |
| GET | `/inventory/balances` | Inventory/Purchasing → Balances → Period and warehouse filters |

The collection does not document a GET customer receivables list. The customer
adjustment action displays its POST response; it does not imply a full AR history view.

### Acceptance checks against the deployed API

1. Create a customer and supplier with non-zero openings; verify exactly one AR/AP
   entry on the backend business date. Verify zero/none creates no entry.
2. Save a supplier with two types, reopen it, and confirm both remain selected.
3. Switch branches in farm/warehouse setup and confirm previous locations clear.
4. Create an invoice with two different items and verify both lines and totals.
5. Receive only part of one item, confirm, then receive the remainder and second item.
   Confirm over-receipt fails and fully received items disappear from receipt choices.
6. Open **AP / Pay**, verify currency and outstanding amount, and select a compatible
   cashbook. Creating an invoice must not itself post cash.
7. Change the balance period and filters; reconcile Opening + In - Out = Closing
   against the inventory ledger for the same item, location, lot, and unit.
8. Post customer AR and supplier AP adjustments using Increase/Decrease, a positive
   amount, branch, and reason (plus currency for AP). Verify the signed amount and
   backend business date in the returned entry; check the supplier AP view refreshes.
   Retry an unchanged failed request and verify it reuses the same idempotency key.

Local checks: `npx tsc --noEmit`, `npm run lint`, and `npm run build`.
Live financial posting and ledger reconciliation require authenticated API verification.
