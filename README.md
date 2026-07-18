# Cloud Based Ed-Tech Platform (Monorepo)

Welcome to the unified **Cloud Based Ed-Tech Platform** codebase. This project has been consolidated into a single working monorepo directory for easy local development and deployment.

---

## 🚀 How to Run the Project Locally

Follow these steps to run the entire project on your localhost.

### Step 1: Start Docker Infrastructure Services
Make sure Docker Desktop is running on your machine, then run:
```bash
docker compose down # Clean up any stale/broken OCI states
docker compose up -d
```
This will start MongoDB, Redis, RabbitMQ, Jaeger, MinIO, Grafana, and Prometheus.

### Step 2: Install Dependencies
Install all package dependencies for both the backend and frontend:
```bash
npm run install:all
```

### Step 3: Seed the Database
Seed the MongoDB database with default student and admin accounts, as well as sample videos:
```bash
npm run seed
```

### Step 4: Run the Development Servers
Start both the NestJS backend and the Vite frontend concurrently:
```bash
npm run dev
```

*   **Frontend Client:** [http://localhost:8080](http://localhost:8080)
*   **Backend API Gateway:** [http://localhost:3000](http://localhost:3000)
*   **Swagger API Docs:** [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
*   **MinIO Console:** [http://localhost:9001](http://localhost:9001) (Credentials: `minioadmin` / `minioadmin`)

---

## 🔑 Seed User Accounts

After running the seed script, you can log in using:

*   **Student Account:**
    *   **Email:** `student@cloudedtech.com`
    *   **Password:** `password123`
*   **Admin Account:**
    *   **Email:** `admin@cloudedtech.com`
    *   **Password:** `password123`
