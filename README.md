# 🎓 Cloud Based Ed-Tech Platform

A modern, full-stack, enterprise-grade Educational Technology (Ed-Tech) platform built as a high-performance monorepo. Features adaptive video playback, role-based dashboards, strict anti-cheating assessment portals, virtual live classrooms, and community discussion rooms.

---

## 🌟 Key Platform Features

- 👥 **Multi-Role Workspace Portals**:
  - **Student Portal**: Dashboard analytics, enrolled courses, quiz assessments, live classes.
  - **Instructor Portal**: Course management, syllabus builder, live stream scheduling (`Go Live`/`End`), student progress tracking.
  - **Admin Portal**: User role management, platform analytics, system metrics.
- 🛡️ **Anti-Cheating Quiz Engine**:
  - Strict assessment portal with full-screen enforcement, tab-switch detection, auto-submission, and copy-paste prevention.
- 📹 **Live Virtual Classrooms**:
  - WebRTC-powered virtual classrooms (Jitsi integration) for real-time lectures and Q&A sessions.
- 💬 **Student Discussion Forum**:
  - Community chat rooms for peer discussions and real-time collaboration.

---

## 🛠️ Technology Stack

- **Frontend**: Vite 7, React 18, TypeScript, Tailwind CSS, Lucide Icons, Axios, Zustand
- **Backend**: NestJS, TypeScript, Mongoose (MongoDB), Socket.io, Passport JWT
- **Database & Services**: MongoDB, Redis (Caching), RabbitMQ (Message Queue), Jitsi (WebRTC)
- **Deployment**: Vercel (Frontend), Render (Backend), MongoDB Atlas (Database)

---

## 🚀 Quick Start (Localhost Setup)

### Prerequisites
- Node.js v18+
- Docker & Docker Desktop (for local MongoDB, Redis, and RabbitMQ)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Govind505/Cloud-Based-Ed-Tech-Platform.git
cd Cloud-Based-Ed-Tech-Platform
npm run install:all
```

### 2. Start Infrastructure Containers
```bash
docker compose up -d mongo redis rabbitmq
```

### 3. Seed Local Database
```bash
npm run seed
```

### 4. Run Development Servers
```bash
npm run dev
```

- **Frontend Application**: `http://localhost:8080`
- **Backend REST API**: `http://localhost:3000`
- **Swagger Documentation**: `http://localhost:3000/api/docs`

---

## 🔑 Seed User Accounts (Local Testing)

All seed accounts use the default password: **`password123`**

| Role | Email | Password | Default Redirect |
| :--- | :--- | :--- | :--- |
| **Student** | `student@cloudedtech.com` | `password123` | `/dashboard` |
| **Instructor** | `instructor@cloudedtech.com` | `password123` | `/instructor` |
| **Admin** | `admin@cloudedtech.com` | `password123` | `/admin` |

---

## 🧹 Database Utility Commands

```bash
# Seed local database with default users and sample videos
npm run seed

# Wipe all database collections for clean production deployment
npm run db:clear
```

---

## 📄 License & Open Source

This repository is sanitized, professional, and free of sensitive credentials. Open for production deployment and customization.
