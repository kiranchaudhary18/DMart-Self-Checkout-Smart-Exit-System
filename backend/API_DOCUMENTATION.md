# DMart Self Checkout API - Postman Testing Guide

This document contains all the endpoints, request methods, URLs, and JSON body details you need to test the entire DMart Self Checkout backend in Postman.

## Base URL
For local development, your base URL is:
`http://localhost:8000`

---

## 1. Authentication (`/api/auth/`)

### Register a Customer
- **Method:** `POST`
- **URL:** `/api/auth/register/`
- **Body (JSON):**
  ```json
  {
      "email": "customer@test.com",
      "password": "strongpassword123",
      "phone": "9876543210",
      "role": "CUSTOMER"
  }
  ```

### Register a Security Guard (Admin/Testing)
- **Method:** `POST`
- **URL:** `/api/auth/register/`
- **Body (JSON):**
  ```json
  {
      "email": "security@test.com",
      "password": "strongpassword123",
      "phone": "9876543211",
      "role": "SECURITY"
  }
  ```

### Login (Get JWT Tokens)
- **Method:** `POST`
- **URL:** `/api/auth/login/`
- **Body (JSON):**
  ```json
  {
      "email": "customer@test.com",
      "password": "strongpassword123"
  }
  ```
  *(Copy the `access` token from the response. In Postman, go to the **Authorization** tab for the remaining requests, select **Bearer Token**, and paste this token.)*

### Get Current User Profile
- **Method:** `GET`
- **URL:** `/api/auth/me/`
- **Headers:** `Authorization: Bearer <access_token>`

---

## 2. Store & Products (`/api/stores/`, `/api/products/`)

### Get Active Store
- **Method:** `GET`
- **URL:** `/api/stores/current/`
- **Headers:** None (Public)

### List All Products
- **Method:** `GET`
- **URL:** `/api/products/`
- **Headers:** None (Public)

### Scan Product by Barcode
- **Method:** `GET`
- **URL:** `/api/products/barcode/1234567890/` (Replace with actual barcode from DB)
- **Headers:** None (Public)

---

## 3. Cart Management (`/api/cart/`)
*(Requires Customer Bearer Token)*

### View Cart
- **Method:** `GET`
- **URL:** `/api/cart/`

### Add Product to Cart (By Product ID)
- **Method:** `POST`
- **URL:** `/api/cart/items/`
- **Body (JSON):**
  ```json
  {
      "product": 1,
      "quantity": 2
  }
  ```

### Add Product to Cart (By Barcode)
- **Method:** `POST`
- **URL:** `/api/cart/items/barcode/`
- **Body (JSON):**
  ```json
  {
      "barcode": "1234567890",
      "quantity": 1
  }
  ```

### Apply Coupon
- **Method:** `POST`
- **URL:** `/api/coupons/apply/`
- **Body (JSON):**
  ```json
  {
      "code": "WELCOME10"
  }
  ```

---

## 4. Checkout & Orders (`/api/orders/`)
*(Requires Customer Bearer Token)*

### Proceed to Checkout
- **Method:** `POST`
- **URL:** `/api/orders/checkout/`
- **Body:** None (Empty `{}`)
  *(This freezes the cart into an Order. Copy the `order_number` from the response.)*

### View Order Details
- **Method:** `GET`
- **URL:** `/api/orders/<order_number>/`

---

## 5. Payments (`/api/payments/`)
*(Requires Customer Bearer Token)*

### Create Razorpay Order
- **Method:** `POST`
- **URL:** `/api/payments/create/`
- **Body (JSON):**
  ```json
  {
      "order_number": "<order_number_from_checkout>"
  }
  ```
  *(Returns a Razorpay Order ID. In a real app, the frontend uses this to open the Razorpay widget.)*

### Verify Payment (Simulate Success)
- **Method:** `POST`
- **URL:** `/api/payments/verify/`
- **Body (JSON):**
  ```json
  {
      "razorpay_order_id": "<rzp_order_id_from_above>",
      "razorpay_payment_id": "pay_fake123456789",
      "razorpay_signature": "fake_signature_for_testing_if_validation_is_mocked"
  }
  ```
  *(Note: Unless Razorpay validation is bypassed in local DB/code, testing fake signatures will throw an error. For full e2e testing locally, you must generate a test signature using your Razorpay Secret, or comment out the signature validation in `payments.services` temporarily).*

---

## 6. Receipts & Loyalty (`/api/receipts/`, `/api/loyalty/`)
*(Requires Customer Bearer Token. Order must be PAID).*

### View Receipt
- **Method:** `GET`
- **URL:** `/api/receipts/<order_number>/`

### View Loyalty Balance
- **Method:** `GET`
- **URL:** `/api/loyalty/balance/`

---

## 7. Smart Exit QR System (`/api/exit-verification/`)

### Generate Exit QR Token (Customer)
- **Method:** `POST`
- **URL:** `/api/exit-verification/generate/`
- **Headers:** `Authorization: Bearer <customer_access_token>`
- **Body (JSON):**
  ```json
  {
      "order_number": "<paid_order_number>"
  }
  ```
  *(Returns `qr_data`. Copy this string to simulate the security guard scanning it.)*

### Verify Exit QR Token (Security Guard)
- **Method:** `POST`
- **URL:** `/api/exit-verification/verify/`
- **Headers:** `Authorization: Bearer <security_access_token>` *(Must login as Security role first)*
- **Body (JSON):**
  ```json
  {
      "qr_data": "<qr_data_from_generate_endpoint>"
  }
  ```
  *(If valid, returns SUCCESS and marks token as used. If scanned again, returns USED_TOKEN error.)*

---

## 8. Admin Analytics (`/api/analytics/`)
*(Requires Admin Bearer Token)*

### View Dashboard Summary
- **Method:** `GET`
- **URL:** `/api/analytics/dashboard/`
- **Headers:** `Authorization: Bearer <admin_access_token>`
