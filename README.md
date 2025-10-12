# Zevlin Bike eCommerce Store

## Project Overview

This project is to build a full-featured eCommerce website for Zevlin Bike. The primary goal is to create a seamless online shopping experience for customers and a simple, intuitive admin interface for the store owner to manage products, orders, and customers without technical assistance.

**Timeline:** The MVP is planned to be completed in one week.

---

## Core Features (MVP)

These are the essential features for the initial launch of the website.

### 1. eCommerce Functionality

*   **Product Listings:** Display all products with details, images, and pricing.
*   **Shopping Cart:** Allow customers to add products to a cart and manage cart items.
*   **Checkout:** A secure checkout process with payment gateway integration.
*   **Order History:** Allow customers to view their past orders.

### 2. Admin CMS

A password-protected admin dashboard for store management.

*   **Product Management:** Create, edit, and delete products. Manage inventory levels.
*   **Order Management:** View and process incoming orders. Update order statuses.
*   **Customer Management:** View customer information and order history.

---

## Bonus Features (Post-MVP)

These features are desirable but not essential for the initial launch. They can be implemented in a future phase.

*   **Content Management:** Allow the store owner to edit content on static pages (e.g., Hero section, About page, etc.).
*   **Blog:** A blog section for articles and news.
    *   **AI Integration:** Tools to assist with writing and generating images for blog posts.
*   **Events System:** A calendar of events with an RSVP feature.
*   **Email Newsletter:** A system for customers to subscribe to a newsletter.

---

## Technology Stack

*   **Framework:** [Next.js](https://nextjs.org/)
*   **Database & Auth:** [Supabase](https://supabase.io/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Deployment:** [Vercel](https://vercel.com/)

---

## Shipping & Delivery Updates

- Shippo integration provides live rates, label purchase/void, and automatic delivery status updates via webhook. See `README-shippo.md` for setup and usage.
- Required env vars (see `.env.local.example`): `SHIPPO_API_TOKEN`, `SHIPPO_WEBHOOK_SECRET`, and `APP_URL`.
- Configure a webhook in your Shippo dashboard pointing to `/api/webhooks/shippo?secret=<SHIPPO_WEBHOOK_SECRET>`.
- Not all shipments use Shippo: admins can manually create shipments and update shipping status from Admin → Order detail. A quick “Update Shipping” menu is available on the order header to set `not_shipped`, `shipped`, `delivered`, `returned`, or `lost`.
