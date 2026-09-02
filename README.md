# CRM Portal - Operations & Client Management System

A complete, production-ready Full Stack CRM & Inventory Operations portal built for wholesale, distribution, and client management.

Designed with **Node.js**, **Express.js**, **MySQL (Prisma ORM)**, and **React (Vite) + Tailwind CSS (Saffron Theme)**.

---

## 🚀 Live Demo & Repository
- **Live Frontend App (Vercel)**: [https://crm-portal-sage-two.vercel.app](https://crm-portal-sage-two.vercel.app)
- **Live Backend API (Render)**: [https://rm-portal-backend.onrender.com](https://rm-portal-backend.onrender.com)
- **GitHub Repository**: [https://github.com/Sandeep405812/crm_portal](https://github.com/Sandeep405812/crm_portal)

---

## 🔑 Test Login Credentials (All 4 Roles)

The application includes a **1-Click Test Login** interface on the login page for rapid reviewer testing:

| Role | Email | Password | Access Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@erp.com` | `Admin@123` | Full unrestricted access to all modules, users, and audit logs |
| **Sales** | `sales@erp.com` | `Sales@123` | Customer CRM, Follow-ups, Create & View Sales Challans |
| **Warehouse** | `warehouse@erp.com` | `Warehouse@123` | Products catalog, Stock In/Out Adjustments, Movement Ledger |
| **Accounts** | `accounts@erp.com` | `Accounts@123` | View Sales Challans, Download PDF Invoices, Revenue Analytics |

---

## 🛠️ Tech Stack

### **Backend**
- **Runtime & Language**: Node.js (JavaScript)
- **Web Framework**: Express.js
- **Database**: MySQL 8.0
- **ORM & Migrations**: Prisma ORM (`@prisma/client`)
- **Authentication**: JWT (`jsonwebtoken`) with `bcryptjs` password hashing
- **Validation**: `zod` schema validation
- **PDF Engine**: `pdfkit` for high-quality server-side Sales Challan / Invoice generation

### **Frontend**
- **Framework**: React 19 (Vite)
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **HTTP Client**: Axios with centralized JWT auth interceptor
- **Routing**: React Router DOM (v7) with Role-Based Protected Routes
- **Notifications**: React Hot Toast

---

## 📋 Core Modules & Business Logic

### 1. 🔐 Authentication & Role-Based Access Control
- JWT-based authentication with secure authorization middleware.
- Dynamic navigation rendering and route protection based on the user's role.

### 2. 🤝 Customer CRM Module
- Search customers across Name, Business Name, Mobile, Email, and GST number.
- Filter by Customer Type (`Retail`, `Wholesale`, `Distributor`) and Status (`Lead`, `Active`, `Inactive`).
- **Follow-up Timeline**: Add follow-up notes with scheduled reminder dates.
- Customer Detail page includes complete contact info and past sales history.

### 3. 📦 Product & Inventory Module
- Real-time stock tracking with SKU uniqueness enforcement.
- **Low Stock Alert**: Automatic visual indicators and banner alerts when `currentStock <= minStockAlert`.
- **Stock Adjustments**: Manual Stock IN (Restock) and Stock OUT (Scrap/Adjustment) with mandatory reason logging.
- **Stock Movement Log**: Immutable audit ledger recording every inventory change, movement type, actor, and timestamp.

### 4. 📄 Sales Challan & Dispatch Module
- Interactive challan creator with customer selector and line item builder.
- **Atomic Transaction**:
  - When saved as `CONFIRMED`, backend verifies available stock for every item.
  - Automatically deducts stock from `Product.currentStock` and inserts records into `StockMovementLog` (`movementType: 'OUT'`).
  - **Stock never goes negative** — returns descriptive error if stock is insufficient.
- **Snapshot Architecture**: Stores customer and product details (name, SKU, unit price at time of sale) as snapshot data.
- **State Machine**:
  - `DRAFT` &rarr; `CONFIRMED`: Verifies stock and reduces inventory.
  - `CONFIRMED` &rarr; `CANCELLED`: Automatically restores inventory and logs `movementType: 'IN'`.
- **PDF Export**: Download professional Sales Challan / Invoice PDF with company header, consignee info, line items, and signature boxes.

---

## 💻 Local Setup Instructions

### Prerequisites
- Node.js (v18+)
- MySQL Server 8.0 (running locally on port 3306)

### 1. Clone & Configure Backend
```bash
cd backend
npm install

# Configure your MySQL connection string in .env:
# DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/mini_erp_db"

# Push database schema & seed initial sample data
npx prisma db push
npm run seed

# Start Backend Server
npm run dev
```
Backend will start on `http://localhost:5000`.

### 2. Configure & Start Frontend
```bash
cd ../frontend
npm install
npm run dev
```
Frontend will start on `http://localhost:3000`.

---

## 🐳 Docker Deployment (One-Command Setup)

To run the entire system (MySQL + Backend + Frontend) using Docker Compose:

```bash
docker-compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`
- MySQL Database: `localhost:3306`

---

## 📮 API Documentation & Postman Collection

A complete Postman collection is included in [`backend/postman_collection.json`](file:///d:/INTERNSHIP%20PROJECT/backend/postman_collection.json).

### Key Endpoints:
- `POST /api/auth/login` - Login & obtain JWT token
- `GET /api/auth/me` - Get current session
- `GET /api/customers` - List & search customers
- `POST /api/customers` - Create customer
- `POST /api/customers/:id/follow-up` - Add follow-up note
- `GET /api/products` - List products & check low-stock
- `POST /api/products` - Create new SKU
- `POST /api/inventory/adjust` - Adjust stock IN/OUT
- `GET /api/inventory/logs` - Stock audit logs
- `GET /api/challans` - List sales challans
- `POST /api/challans` - Create challan (Draft / Confirmed)
- `PATCH /api/challans/:id/status` - Update status (Confirm / Cancel)
- `GET /api/challans/:id/pdf` - Download Challan PDF
- `GET /api/dashboard/stats` - Executive dashboard KPIs

---

## 🏛️ System Architecture

```
                               ┌─────────────────────────┐
                               │  React 19 (Vite) + CSS  │
                               │  Tailwind Admin Portal  │
                               └────────────┬────────────┘
                                            │ HTTP / REST
                                            ▼
                               ┌─────────────────────────┐
                               │   Express.js Backend    │
                               │   (JWT Auth + Zod)      │
                               └────────────┬────────────┘
                                            │ Prisma ORM
                                            ▼
                               ┌─────────────────────────┐
                               │     MySQL Database      │
                               │ (ACID Transactions)     │
                               └─────────────────────────┘
```

---

## 📝 Assumptions & Known Behaviors
1. **Stock Reduction**: Stock is only deducted when a Challan is in `CONFIRMED` status. Draft challans do not reserve or deduct inventory.
2. **Cancelled Orders**: Cancelling a previously `CONFIRMED` challan returns the exact quantities back to warehouse inventory and logs a movement reason.
3. **Role Gating**: Admin role has master override access across all endpoints.
