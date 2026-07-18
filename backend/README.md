# Cloud Based Ed-Tech Platform Backend

NestJS microservices backend for the Cloud Based Ed-Tech Platform adaptive streaming platform.

## 📁 Project Structure

```
src/
├── main.ts                  # Application entry point
├── app.module.ts            # Root application module
├── config/                  # Configuration management
│   ├── database.config.ts
│   ├── redis.config.ts
│   ├── rabbitmq.config.ts
│   └── jwt.config.ts
├── modules/                 # Feature modules
│   ├── auth/                # Authentication service
│   ├── users/               # User management
│   ├── content/             # Video content metadata
│   ├── streaming/           # HLS streaming service
│   ├── encoding/            # FFmpeg encoding pipeline
│   └── analytics/           # Usage analytics
├── common/                  # Shared utilities
│   ├── decorators/          # Custom decorators
│   ├── filters/             # Exception filters
│   ├── guards/              # Auth guards
│   ├── middleware/          # Request middleware
│   ├── pipes/               # Validation pipes
│   └── utils/               # Helper functions
└── types/                   # TypeScript definitions
```

## 🚀 Getting Started

### Install Dependencies
```bash
npm install
```

### Start Development
```bash
npm run start:dev
```

### Run Tests
```bash
npm run test
npm run test:cov
```

### Build for Production
```bash
npm run build
npm run start:prod
```

## 📚 API Documentation

Once the server starts, visit: `http://localhost:3000/api/docs`

## 🔧 Configuration

All configuration is managed via `.env` file in the root directory.

Key environment variables:
- `NODE_ENV`: development, test, production
- `MONGODB_URI`: MongoDB connection string
- `REDIS_HOST`, `REDIS_PORT`: Redis configuration
- `JWT_SECRET`: JWT signing secret
- `RABBITMQ_URL`: RabbitMQ connection URL

## 🧪 Testing

```bash
# Unit tests
npm run test

# Integration tests (e2e)
npm run test:e2e

# Coverage report
npm run test:cov
```

## 📊 Monitoring

- **Prometheus Metrics**: `http://localhost:3000/metrics`
- **Health Check**: `http://localhost:3000/health`
- **Swagger Docs**: `http://localhost:3000/api/docs`

## 🔐 Authentication

All API endpoints (except `/auth/register`, `/auth/login`, `/health`) require JWT bearer token:

```bash
curl -H "Authorization: Bearer <your-token>" http://localhost:3000/api/users/profile
```

## 📦 Services

### Auth Service
- User registration & login
- JWT token generation
- Token refresh

### Users Service
- User profile management
- Role-based access control

### Content Service
- Video metadata management
- Course associations
- Content organization

### Streaming Service
- HLS manifest generation
- Adaptive bitrate selection
- Streaming session tracking

### Encoding Service
- FFmpeg worker integration
- Multi-quality encoding (240p, 360p, 480p, 720p)
- Job queue management (RabbitMQ)

### Analytics Service
- Streaming event tracking
- User engagement metrics
- Quality metrics

## 🔄 Data Flow

```
Client
  ↓
API Gateway (Rate Limit, Auth)
  ↓
Request Handler
  ↓
Service Layer
  ↓
Database (MongoDB) & Cache (Redis)
  ↓
Response
```

## 🚢 Deployment

See root `README.md` for Docker and Kubernetes deployment instructions.
