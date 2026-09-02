# 🚀 100% Free Production Deployment Guide

A simple step-by-step guide to deploying the **Mini ERP + CRM Operations Portal** on free cloud platforms:

---

## 🗄️ Step 1: Deploy Free Cloud MySQL Database

You can create a free cloud MySQL database on **[Aiven.io](https://aiven.io)**, **[TiDB Serverless](https://tidbcloud.com)**, or **[Railway.app](https://railway.app)**:

### Using Aiven (Free Tier MySQL):
1. Sign up on [aiven.io](https://aiven.io).
2. Click **Create Service** &rarr; Select **MySQL** &rarr; Choose Free Plan.
3. Once created, copy the **Service URI** (e.g. `mysql://avnadmin:password@host:port/defaultdb?ssl-mode=REQUIRED`).
4. Keep this connection string ready for Step 2.

---

## 🖥️ Step 2: Deploy Backend on Render.com (Free)

1. Push your project code to **GitHub**.
2. Sign up / Log in to [Render.com](https://render.com).
3. Click **New +** &rarr; Select **Web Service**.
4. Connect your GitHub repository.
5. Set the configuration:
   - **Name**: `mini-erp-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npx prisma generate && npx prisma db push && npm run seed`
   - **Start Command**: `npm run start`
6. Add **Environment Variables** under the "Environment" tab:
   - `PORT`: `5000`
   - `DATABASE_URL`: *(Paste the cloud MySQL URL from Step 1)*
   - `JWT_SECRET`: `your_random_super_secret_production_key_2026`
   - `JWT_EXPIRES_IN`: `7d`
   - `NODE_ENV`: `production`
7. Click **Deploy Web Service**.
8. Render will provide your Live Backend API URL:
   `https://mini-erp-backend.onrender.com`

---

## 🌐 Step 3: Deploy Frontend on Vercel (Free)

1. Sign up / Log in to [Vercel.com](https://vercel.com).
2. Click **Add New...** &rarr; **Project**.
3. Import your GitHub repository.
4. Set the configuration:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
5. Expand **Environment Variables** and add:
   - `VITE_API_BASE_URL`: `https://mini-erp-backend.onrender.com/api` *(Your Render backend URL + /api)*
6. Click **Deploy**.
7. Vercel will build and give you your live production URL:
   `https://mini-erp-portal.vercel.app`

---

## ✅ Step 4: Verification

Open your live Vercel URL in your browser:
1. Click **Create Account** to register a new user or use the seeded admin credentials.
2. Test creating Customers, Products, and Sales Challans with PDF download.
3. Submit the live frontend and backend URLs in your case study submission!
