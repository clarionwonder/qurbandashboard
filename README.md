# GERMY Qurban

Online qurban and aqiqah management for GERMY: organisers set up campaigns and packages, participants book shares (bahagian) and pay online, and shares are allocated to animals automatically.

## Try it locally (demo mode)

No database or payment keys needed. The app runs on built-in sample data that resets on restart.

```bash
npm install
DEMO_MODE=true npm run build
DEMO_MODE=true npm start      # open http://localhost:3000 and http://localhost:3000/admin
```

On Windows PowerShell use `$env:DEMO_MODE="true"; npm run build; npm start`. In demo mode the organiser dashboard needs no sign-in and a "Demo payment" option marks bookings paid.

## Language and theme

Every page, participant and organiser, switches between Bahasa Malaysia and English (BM / EN in the header). Bahasa Malaysia is the default. The theme button cycles dark, light and "match device". Both choices are remembered in a cookie. Text lives in `src/lib/i18n/dict.ts`. Receipts and certificates always print in light colours.

## Features

**Participants (public)**
- Campaign page at `/c/<slug>` with packages, live availability and a booking form (one participant name per share).
- Online payment through Billplz, ToyyibPay, Bayarcash or SenangPay, or manual bank transfer with receipt upload.
- Order page with payment status, allocated animal and share number, and slaughter / distribution progress.
- Printable receipt and participation certificate (Print, then Save as PDF).
- Order lookup at `/semak` by order number and phone.

**Organisers (`/admin`)**
- Overview of every active campaign: amount collected, shares sold, orders to verify, animal progress.
- Campaigns and packages: animal type, shares per animal (7 for cow, 1 for goat), price per share, optional cap on animals.
- Animal board: each animal's 7 slots and names; move it through filling, full, slaughtered, distributed.
- Orders: filter and search, approve manual transfers, view uploaded receipts, edit participant names, internal notes, gateway log.
- Reports per campaign (by package, by payment method, execution progress) and CSV export of orders and participants.

## How share allocation works

Shares are allocated when an order is confirmed paid, inside the `mark_order_paid` database function:
1. If an animal that is still filling has room for the whole order, the order goes there, so a family stays together.
2. A booking of a whole animal (for example 7 shares of a cow) gets a fresh animal.
3. Otherwise the oldest filling animal is topped up first and new animals are opened as needed.

Animals are coded with the package prefix (`LMB-001`, `KBG-001`, …) and are marked full automatically. Unpaid gateway orders hold stock for 30 minutes so a package with a cap cannot be oversold.

## Payment gateways

Every gateway is optional. A gateway appears on the booking form only when its keys are set. Manual transfer appears when the campaign has bank details.

| Gateway | Env vars | Set in gateway dashboard |
| --- | --- | --- |
| Billplz | `BILLPLZ_API_KEY`, `BILLPLZ_COLLECTION_ID` | nothing (URLs are sent per bill) |
| ToyyibPay | `TOYYIBPAY_SECRET_KEY`, `TOYYIBPAY_CATEGORY_CODE` | nothing (URLs are sent per bill) |
| Bayarcash | `BAYARCASH_PAT`, `BAYARCASH_PORTAL_KEY`, `BAYARCASH_SECRET_KEY` | nothing (URLs are sent per intent) |
| SenangPay | `SENANGPAY_MERCHANT_ID`, `SENANGPAY_SECRET_KEY` | Return URL `https://<site>/api/payments/senangpay/return` and Callback URL `https://<site>/api/payments/senangpay/callback` |

Payments are never trusted from the browser alone. Billplz, ToyyibPay and Bayarcash results are confirmed by looking the bill up with the gateway's API (or by a valid checksum for Bayarcash). SenangPay results are checked against its hash. The paid amount must cover the order. Every callback is logged in `payment_events`.

`PAYMENT_MODE=sandbox` (the default) sends everything to each gateway's test environment. Set `PAYMENT_MODE=production` to go live. `ENABLE_DEMO_PAYMENT=true` adds a test button that marks an order paid. Keep it off in production.

## Setup

1. Create a Supabase project and run `supabase/migrations/20261124000000_init.sql` (SQL editor, or `supabase db push`).
2. In Supabase Auth, add a user for each organiser (Authentication, Users, Add user, with a password).
3. Copy `.env.example` to `.env.local` and fill it in. Put organiser emails in `ADMIN_EMAILS`; they are made admins the first time they sign in.
4. `npm install` then `npm run dev`, and open http://localhost:3000/admin.
5. Create a campaign, add packages, set its status to **Open**, and share `/c/<slug>`.

Deploy on Vercel (or any Node host) with the same environment variables and `NEXT_PUBLIC_SITE_URL` set to the public URL.

## Stack

Next.js 15 (App Router, server actions), Tailwind CSS 4, Supabase (Postgres, Auth, Storage). All database access from public pages goes through server code using the service role key. Row level security allows only admins to read orders and shares from the browser.

## Not in version 1

Monthly instalments / auto-debit, agent and affiliate links, WhatsApp and SMS blasts, and email notifications.
