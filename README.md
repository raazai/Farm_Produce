# Mandi Direct: Farm Produce Marketplace

A front-end marketplace that connects small farmers directly with local buyers. Farmers list what they grow, how much they have and when it will be ready. Buyers search, filter and send order requests, then follow their status.

Built with plain **HTML, CSS and JavaScript**. No frameworks, no build step, no server.

## Features

| Requirement | Where to find it |
|---|---|
| Farmer profiles | **Farmers** tab: name, village, bio, active listings |
| Produce listings | **Sell produce** tab: add or remove listings |
| Quantity | Every listing shows units in stock; stock drops when an order is accepted |
| Expected availability | "Available now" or "Ready 12 Dec" tag, plus an "Available now only" filter |
| Pricing | Price per unit, plus an estimated total on the order form |
| Buyer search | Search by crop, farmer, village or note |
| Category filters | Vegetables, Fruits, Grains & Pulses, Dairy & Eggs, Spices & Herbs |
| Order request | "Request order" form with name, phone, quantity, pickup date, message |
| Order status | Pending → Accepted → Ready for pickup → Completed (or Declined / Cancelled) |

## How to run

1. Put `index.html`, `style.css` and `script.js` in one folder.
2. Open `index.html` in any modern browser.

Optional local server: `python -m http.server 8000`, then visit `http://localhost:8000`.

## Try the full flow

1. **Market** tab: pick a crop and click **Request order**. Fill in the form and send.
2. **My orders** tab: enter the same name to see the request as *Pending*.
3. **Sell produce** tab: choose the farmer who owns that crop under *Selling as*. Accept the request, then move it to *Ready for pickup* and *Completed*.
4. Back in **My orders**, the status has updated.

## Project structure

```
index.html   page structure and views
style.css    styling (responsive, light and dark mode)
script.js    data, search/filter logic, orders, dashboard
README.md    this file
```

## How it works

- Data (farmers, listings, orders) lives in `localStorage` under the key `mandi_db`, so it survives page reloads in the same browser.
- Sample data is generated on first load. Use **Reset demo data** in the footer to restore it.
- Availability is computed by comparing each listing's ready date with today's date.
- All user-entered text is escaped before being shown, to prevent HTML injection.

## Limitations

This is a front-end demo. There are no real accounts, so the "Selling as" dropdown stands in for farmer login, and data is not shared between devices. Payments are not included.

## Ideas for next steps

- Backend and database (Node/Express with MongoDB or PostgreSQL) plus real login
- SMS or WhatsApp notifications when order status changes
- Photos for listings, ratings for farmers
- Map or distance-based search
- Punjabi and Hindi language options
