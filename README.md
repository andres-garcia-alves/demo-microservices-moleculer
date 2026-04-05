# Microservices Demo with Moleculer

Complete demonstration of microservices architecture using the [Moleculer framework](https://moleculer.services) with production-ready features.

**Included Services:**
- 👤 **User Service** - User creation and management (SQLite)
- 🔐 **Auth Service** - Authentication with JWT and bcrypt
- 📧 **Email Service** - Email sending (listens to user events)
- 🔌 **API Gateway** - REST API with Swagger/OpenAPI

---

## 🚀 Implemented Features

### ✅ Dynamic Transporters (TCP vs RabbitMQ)
- **TCP** (default) - Development without external dependencies
- **AMQP** (RabbitMQ) - Scalable production
- Switch between transporters by updating `TRANSPORTER_TYPE` variable only

### ✅ Authentication and Security
- JWT tokens with configurable expiration
- Password hashing with bcryptjs
- Login and token verification endpoints

### ✅ Health Checks and Metrics
- `/health` endpoints on each service
- Uptime and memory usage monitoring
- Service status verification

### ✅ API Gateway and Documentation
- Centralized REST API on port 3000
- Automatic Swagger/OpenAPI documentation
- REST routes structured by service

### ✅ Structured Logging
- Winston logger with JSON formatting
- Logs to files and console
- Configurable logging level
- Complete event traceability

### ✅ Testing with Vitest
- Modern testing framework (Jest replacement)
- 10-100x faster than Jest
- Native ESM support
- Visual UI for tests (`npm run test:ui`)

### ✅ External Configuration
- Environment variables via `.env`
- Configurable: JWT_SECRET, TRANSPORTER_TYPE, LOG_LEVEL, etc.
- `.env.example` as reference

---

## 📋 Requirements

- Node.js 18+ (recommended v20)
- npm 9+
- Docker (optional, only if you use RabbitMQ)

---

## 🛠️ Installation

```bash
# 1. Clone/download the project
cd Demo-Microservices-Nodejs-Moleculer

# 2. Install dependencies
npm install

# 3. Copy example configuration
cp .env.example .env
```

---

## 🚀 Running the Project

### Option A: TCP (Without RabbitMQ) ⭐ Recommended for development

```bash
# Uses TCP by default
npm start
```

✅ Works without installing anything additional
✅ Fast and simple for development
✅ All services communicate correctly

### Option B: AMQP (With RabbitMQ)

**Step 1: Start RabbitMQ**
```bash
# Option a) Docker
npm run rabbitmq

# Option b) Docker Compose (full stack)
npm run docker:up
```

**Step 2: Update `.env`**
```env
TRANSPORTER_TYPE=AMQP
RABBITMQ_URL=amqp://localhost
```

**Step 3: Start services**
```bash
npm start
```

### Option C: Docker Compose (Full Stack)

```bash
npm run docker:up
```

Stop:
```bash
npm run docker:down
```

---

## 📊 API Endpoints

### Health Checks
```
GET http://localhost:3000/health
```

### Users
```
POST http://localhost:3000/users
Content-Type: application/json

{
  "username": "john",
  "email": "john@example.com"
}
```

```
GET http://localhost:3000/users
```

### Authentication
```
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGc...",
  "expiresIn": "24h"
}
```

```
POST http://localhost:3000/auth/verify
Content-Type: application/json

{
  "token": "eyJhbGc..."
}
```

### Swagger Documentation
```
GET http://localhost:3000/api/docs
```

---

## 🧪 Testing

### Run tests (once)
```bash
npm test
```

### Watch mode (re-runs on file changes)
```bash
npm run test:watch
```

### Coverage report
```bash
npm run test:coverage
```

### Visual UI for tests (new with Vitest)
```bash
npm run test:ui
```

---

## 📁 Project Structure

```
.
├── services/
│   ├── user/              # User microservice
│   │   └── __tests__/
│   ├── auth/              # Auth microservice with JWT
│   │   └── __tests__/
│   ├── email/             # Email microservice
│   │   └── __tests__/
│   ├── gateway/           # API Gateway with Swagger
│   └── shared/            # Shared utilities
│       ├── transporter.js # Dynamic TCP/AMQP configuration
│       ├── logger.js      # Winston logger
│       ├── jwt.js         # JWT token management
│       ├── sqlite.js      # SQLite utilities
│       ├── healthCheck.js # Health check generator
│       └── rabbitmq.js    # RabbitMQ helpers (deprecated)
├── docs/
│   ├── ENHANCEMENT_ROADMAP.md           # 7-point improvement plan
│   └── TRANSPORTER_CONFIGURATION_PLAN.md # TCP vs AMQP architecture documentation
├── index.js               # Services orchestrator
├── .env.example           # Example environment variables
├── package.json           # Dependencies and scripts
├── vitest.config.js       # Test configuration
├── Dockerfile             # For containerization
├── docker-compose.yml     # Full stack with RabbitMQ
└── README.md              # This file
```

---

## ⚙️ Configuration

### Environment Variables (.env)

```env
# Transporter: TCP (default, no dependencies) or AMQP (RabbitMQ)
TRANSPORTER_TYPE=TCP
RABBITMQ_URL=amqp://localhost

# JWT
JWT_SECRET=your-secret-key-change-in-prod
JWT_EXPIRES_IN=24h

# SQLite databases
USER_DB_PATH=services/user/user.db
AUTH_DB_PATH=services/auth/auth.db
EMAIL_DB_PATH=services/email/email.db

# Logging
LOG_LEVEL=info

# Application
NODE_ENV=development
GATEWAY_PORT=3000
```

---

## 🔄 Dynamic Transporter Changes

### TCP vs AMQP - When to use each?

| Scenario | TRANSPORTER_TYPE | Command |
|----------|------------------|---------|
| Local development | TCP | `npm start` |
| Testing | TCP | `npm test` |
| Production | AMQP | `npm start` (with RabbitMQ running) |
| Demo/POC | TCP | `npm start` |

**No code changes needed in services** - Just update the environment variable!

---

## 📦 Main Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| moleculer | 0.15.0 | Microservices framework |
| moleculer-web | 0.11.0 | REST API Gateway |
| sqlite3 | 5.1.6 | Local database |
| jsonwebtoken | 8.5.1 | JWT tokens |
| bcryptjs | 2.4.3 | Password hashing |
| winston | 3.19.0 | Structured logging |
| vitest | 1.0.0 | Testing framework |
| amqplib | 0.10.3 | RabbitMQ client (optional) |

---

## 🐛 Troubleshooting

### Error: "ECONNREFUSED" with TRANSPORTER_TYPE=AMQP
**Solution:** RabbitMQ is not running. Run `npm run rabbitmq` in another terminal.

### Error: "Port 3000 already in use"
**Solution:** Change port in `.env`:
```env
GATEWAY_PORT=3001
```

### Tests fail with ESM
**Solution:** Vitest natively supports ESM. Make sure you have `"type": "module"` in package.json.

### Logs not being saved
**Solution:** Create `logs/` directory:
```bash
mkdir logs
```

---

## 📚 Additional Documentation

- [ENHANCEMENT_ROADMAP.md](docs/ENHANCEMENT_ROADMAP.md) - 7-point improvement plan details
- [TRANSPORTER_CONFIGURATION_PLAN.md](docs/TRANSPORTER_CONFIGURATION_PLAN.md) - TCP vs RabbitMQ architecture details
- [Moleculer Documentation](https://moleculer.services)
- [Vitest Documentation](https://vitest.dev)

---

## 🎯 Suggested Future Improvements

- [ ] Implement Kafka as alternative transporter
- [ ] Add OAuth2 authentication
- [ ] Implement Circuit Breaker pattern
- [ ] Add rate limiting
- [ ] Implement distributed caching (Redis)
- [ ] Add Prometheus metrics
- [ ] Implement distributed tracing

---

## 📝 License

This project is open source and available under the ISC license.

---

## 👨‍💻 Development

### Creating a new service

1. Create directory: `services/new-service/`
2. Create file: `new-service.service.js`
3. Import in `index.js`
4. Start: `npm start`

Reference: [services/user/user.service.js](services/user/user.service.js)

### Adding tests

1. Create: `services/feature/__tests__/feature.test.js`
2. Run: `npm test`
3. View coverage: `npm run test:coverage`

---

**Last updated:** April 2026
