# Full-Stack Implementation: VTU & Exam Pin Platform

This updated plan covers building a **functional, real, and secure** platform as requested. To achieve this, we will expand the project from just a React frontend to a full-stack application by introducing a secure Node.js backend. 

The backend is critical because **API keys (Paystack Secret Key, VTU API keys) must never be exposed in the React frontend code.**

## User Review Required

> [!IMPORTANT]
> **1. Paystack Integration:** We will use Paystack for payments. To test this, you will eventually need a Paystack account to get your "Test Secret Key". The system will be built to use this securely.
>
> **2. Database Requirements:** The PRD mentions PostgreSQL and Redis. For local development and to get a functional prototype running quickly, would you like me to set up a local SQLite database (which requires zero setup on your machine) instead of PostgreSQL for now? We can easily swap to Postgres for production later.
>
> **3. Folder Structure:** I propose keeping the current React app in the root directory and creating a new folder called `server/` inside this project to hold the Node.js backend. Is this structure okay with you?

## Proposed Architecture

- **Frontend (React/Vite):** Handles UI, user input, and redirects the user to the Paystack checkout page.
- **Backend (Node.js/Express):** Handles secure operations. It receives purchase requests from the frontend, securely initializes transactions with Paystack, listens for Paystack Webhooks (to know when a payment succeeds), and then securely communicates with the VTU API to deliver the service.

---

## Phase 1: Frontend UI Implementation (React)

We will modify your current React application to support the Guest Checkout flow.

### [MODIFY] `src/App.jsx`
- Remove `/connect` route.
- Add `/airtime` and `/exam-pins` routes.

### [MODIFY] `src/components/Header.jsx` & `src/components/MobileNav.jsx`
- Remove the "Let me in..." login button.
- Add links to "Buy Airtime" and "Exam Pins".

### [MODIFY] `src/components/HeroWrapper.jsx`
- Update text and typing animation to focus on WAEC/NECO pins and Airtime.
- Change CTA to point to the services.
- [DELETE] `src/Pages/Connect.jsx`

### [NEW] `src/Pages/Airtime.jsx` & `src/Pages/ExamPins.jsx`
- Create responsive guest checkout forms.
- When submitted, these forms will make an API call to our new Node.js backend instead of directly to Paystack.

---

## Phase 2: Secure Backend Implementation (Node.js)

We will build an Express server to handle the secure business logic.

### [NEW] `server/package.json`
- Initialize a Node.js project.
- Install dependencies: `express`, `cors`, `dotenv`, `axios`, and database tools.

### [NEW] `server/.env`
- Secure storage for `PAYSTACK_SECRET_KEY` and `VTU_API_KEY`. (This file will be ignored by git).

### [NEW] `server/server.js`
- Set up the Express application, enable CORS for the React frontend, and start the server on port 3000.

### [NEW] `server/routes/transactions.js`
- **POST `/api/initialize-transaction`:** Endpoint called by the React frontend. It receives order details (email, amount, service type), calls the Paystack API securely to initialize the transaction, and returns the Paystack checkout URL back to the frontend.

### [NEW] `server/routes/webhooks.js`
- **POST `/api/webhook/paystack`:** The most critical endpoint. Paystack will call this URL silently in the background when a payment succeeds.
- Verifies the cryptographic signature of the webhook to ensure it actually came from Paystack.
- On successful payment, triggers the function to call the VTU Africa API to dispense the Airtime or Exam Pin.

### [NEW] `server/services/vtuService.js`
- Securely interacts with `vtuafrica.com.ng/api/` using the hidden API keys to fulfill the order.

## Verification Plan

1. **Frontend:** Verify forms collect data correctly and route to the backend.
2. **Backend:** Test the `/initialize-transaction` endpoint using dummy data to ensure it successfully generates a Paystack checkout URL.
3. **Webhook:** Use Paystack's testing tools or a tool like ngrok to simulate a successful payment and ensure the backend verifies the signature and attempts to call the VTU API.
