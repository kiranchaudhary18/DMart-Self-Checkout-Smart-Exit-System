# DMart – Self Checkout & Smart Exit System

The DMart Self Checkout & Smart Exit System is a robust Django backend API providing a seamless in-store shopping experience. Customers can scan products, add them to a digital cart, apply coupons, pay via Razorpay, and receive a secure exit QR code. Store security can scan this QR code at the exit to verify purchases.

## Features
- **User Authentication:** JWT-based auth with Role-Based Access Control (Customer, Security, Admin).
- **Product & Inventory Management:** Barcode/SKU lookup, category filtering, and real-time inventory adjustments.
- **Cart & Pricing:** Live calculation of cart totals, discounts, and GST.
- **Orders & Payments:** Secure Razorpay integration for checkout and verification.
- **Receipts & Loyalty:** Digital receipts and a points-based loyalty program.
- **Smart Exit QR System:** Time-limited, encrypted exit tokens used for verification at the store exit.
- **Fraud Detection:** Automated tracking of suspicious activities (invalid tokens, order mismatches) with severity levels.
- **Notifications:** Isolated, asynchronous email notification system for payments, receipts, and security alerts.
- **Analytics:** Data aggregation for sales, inventory, and fraud metrics (Admin only).

## Tech Stack
- **Backend:** Django 5.1, Django REST Framework (DRF)
- **Database:** PostgreSQL
- **Authentication:** SimpleJWT
- **Payment Gateway:** Razorpay
- **API Documentation:** drf-spectacular (Swagger UI)

## Backend Setup (Local Development)
1. **Clone and Setup Virtual Environment:**
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows use: .venv\Scripts\activate
   pip install -r requirements.txt
   ```
2. **Environment Variables:**
   Copy `.env.example` to `.env` and configure your local development variables.
   *Ensure you set `DJANGO_DEBUG=True` and `DB_NAME`, `DB_USER`, `DB_PASSWORD` for your local PostgreSQL instance.*
3. **Database Migration:**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```
4. **Run Local Server:**
   ```bash
   python manage.py runserver
   ```
5. **Testing:**
   ```bash
   python manage.py test --keepdb
   ```

## Production Notes
This project is configured for secure production deployment.
- **Environment Variables:** All critical settings (`DJANGO_SECRET_KEY`, `RAZORPAY_KEY_SECRET`, `EMAIL_HOST_PASSWORD`, `DB_PASSWORD`) MUST be injected via environment variables. NEVER commit real credentials to `.env`.
- **Database:** SQLite is intentionally disabled. Ensure you connect to a managed PostgreSQL instance.
- **Static Files:** Run `python manage.py collectstatic --noinput` during deployment to bundle static files.
- **Security Headers:** Enforce HTTPS in production by setting `SECURE_SSL_REDIRECT=True` in your environment.

### Production Start Command (Example)
Do NOT use `runserver` in production. Use a WSGI server like Gunicorn:
```bash
gunicorn config.wsgi:application --bind 0.0.0.0:8000
```

## API Documentation
Once the server is running, you can view the complete API documentation at:
- Swagger UI: `http://localhost:8000/api/docs/`
- OpenAPI Schema: `http://localhost:8000/api/schema/`
