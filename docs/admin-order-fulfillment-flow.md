# Admin Order Fulfillment Flow (End-to-End)

This document outlines the end-to-end steps an admin follows, starting at `/admin`, when an order has been placed, paid, and is ready to fulfill.

## Steps

1. Open `/admin` (Dashboard).
2. Review “Today’s Focus → Orders to Fulfill” and the “To Fulfill” table (orders with `order_status = pending_fulfillment`, `shipping_status = not_shipped`, `payment_status = paid`).
3. Click “Start” or open “Fulfillment” from the left nav to navigate to `/admin/fulfillment`.
4. Locate the order (search by ID, customer, or email); review items, calculated weight, ship-to address, and order total.
5. Click “Get Rates” to open the rates dialog.
6. System loads shipping packages from `/api/shipping/packages` and selects the default package.
7. System posts to `/api/shipping/rates` with `orderId` + `packageId`; server computes parcel weight and fetches live Shippo rates; rates display sorted by price with estimated days.
8. Click “Buy Label” on the chosen rate; client posts to `/api/shipping/labels` with an `Idempotency-Key`.
9. Server purchases the label via Shippo, inserts a `shipments` row (tracking number/url, `label_url`), updates the order (`order_status → fulfilled`, `shipping_status → shipped`), sends a “your order shipped” email to the customer, and logs a shipment event.
10. The UI opens the label PDF/image in a new tab; the order drops out of the Fulfillment queue upon refresh.
11. Print paperwork from the order detail page `/admin/order/{id}`:
    - Print Packing Slip.
    - Print Label.
    - Print “Label + Packing Slip” (combined preview via `/api/shipping/label-proxy` + pdf.js).
12. Optional alternatives and updates:
    - Manual shipment (Order Detail → “Manual Shipment”): save carrier/service/tracking and email the customer (inserts shipment; typically updates order/shipping statuses).
    - Update shipping status (Order Detail → “Update Shipping”): set `not_shipped`/`shipped`/`delivered`/`returned`/`lost` via `/api/admin/orders/bulk`.
    - Mark a specific shipment delivered (Order Detail → shipments list) via `PATCH /api/admin/shipments/{shipmentId}` (emails customer).
    - Void a purchased label (Order Detail → shipments list) via `POST /api/shipping/labels/void`; shipment status becomes `voided`.
    - Perform bulk status changes in `/admin/orders` when needed.

## Result

A placed/paid order moves from `pending_fulfillment` to `fulfilled`/`shipped` when a label is purchased (or a manual shipment is recorded). The customer is notified, and admins can print the label and packing slip together.

