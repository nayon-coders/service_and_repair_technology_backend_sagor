# 1 Service & Repair Technology - Backend API

REST API server with Prisma ORM and MySQL database for **1 Service & Repair Technology ERP & Management System**.

## Tech Stack
- **Runtime**: Node.js & Express.js (TypeScript)
- **Database & ORM**: MySQL 8.0+ with Prisma ORM v5
- **Authentication**: JWT (JSON Web Tokens) with HttpOnly cookies & Bearer headers, Bcrypt password hashing
- **Architecture**: Modular Services, Controllers, Validators, Centralized Error Handling

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure your `DATABASE_URL` matches your local or remote MySQL credentials:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/business_management"
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your_super_secret_jwt_key_min_32_characters_long
JWT_EXPIRES_IN=1d
```

### 3. Run Prisma Migrations & Generate Client
```bash
npx prisma migrate dev
npx prisma generate
```

### 4. Seed Database (Roles, Initial Admin, Sample Data)
```bash
npm run seed
```

### 5. Run Development Server
```bash
npm run dev
```
Health Check: [http://localhost:5000/api/v1/health](http://localhost:5000/api/v1/health)

### 6. Build for Production
```bash
npm run build
npm start
```
