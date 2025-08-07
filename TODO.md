High Priority: Core Functionality (MVP)

  1. Checkout & Payment Processing

   * [ ] Integrate a payment gateway: The current checkout process doesn't handle payments. We
     need to integrate stripe.
       * [ ] Add the payment gateway's SDK to the project.
       * [ ] Create a payment form component (e.g., using Stripe Elements) to securely collect
         card information.
       * [ ] Update the processCheckout action to create a payment intent and confirm the
         payment on the server.
   * [ ] Improve error handling: Add more specific error messages for payment failures.
   * [ ] Send order confirmation emails: After a successful order, send a confirmation email to
     the customer.

  2. Admin Panel: Product Management

   * [ ] Create the product list page:
       * [ ] Fetch all products from the database in app/admin/products/page.tsx.
       * [ ] Implement the ProductTable.tsx component to display the products in a table.
       * [ ] Add "Edit" and "Delete" buttons for each product.
   * [ ] Create the "Add/Edit Product" page:
       * [ ] Create a new page (e.g., app/admin/products/new and app/admin/products/[id]/edit).
       * [ ] Build a form for creating and editing products (name, description, price, images,
         etc.).
       * [ ] Implement the server actions to add and update products in the database.
   * [ ] Implement product deletion:
       * [ ] Create a server action to delete a product.
       * [ ] Add a confirmation dialog to prevent accidental deletions.

  3. Admin Panel: Order Management

   * [ ] Create the order list page:
       * [ ] Fetch all orders from the database in app/admin/orders/page.tsx.
       * [ ] Implement an OrderTable.tsx component to display the orders.
       * [ ] Add a "View" button for each order.
   * [ ] Create the order details page:
       * [ ] Create a new page (e.g., app/admin/orders/[id]).
       * [ ] Display all order details, including customer information, shipping address, and
         line items.
       * [ ] Add the ability to update the order status (e.g., "Processing," "Shipped,"
         "Completed").

  Medium Priority: Improvements & Admin Features

  4. Admin Panel: Dashboard

   * [ ] Connect the dashboard to real data:
       * [ ] Fetch real stats (total revenue, orders, etc.) from the database.
       * [ ] Fetch recent orders and display them on the dashboard.

  5. Admin Panel: Customer Management

   * [ ] Create the customer list page:
       * [ ] Fetch all customers from the database in app/admin/customers/page.tsx.
       * [ ] Implement a CustomerTable.tsx component to display the customers.
   * [ ] Create the customer details page:
       * [ ] Create a new page (e.g., app/admin/customers/[id]).
       * [ ] Display customer details and their order history.

  6. Authentication & User Experience

   * [ ] Admin role-based access control:
       * [ ] Add a role column to the users or customers table.
       * [ ] Protect the /admin routes so that only users with an "admin" role can access them.
   * [ ] Improve post-login/registration flow:
       * [ ] Ensure the user's cart is preserved after logging in or registering.
       * [ ] Pre-fill the checkout form with the user's information after they log in.

  Low Priority: "Nice to Have" Features

  7. Promo Codes

   * [ ] Move promo codes to the database: Instead of being hardcoded, store promo codes in the
     database with their corresponding discounts.
   * [ ] Implement promo code validation: Update the checkout logic to validate promo codes
     against the database.
