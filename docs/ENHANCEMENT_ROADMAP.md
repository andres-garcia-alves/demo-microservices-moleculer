# Enhancement Roadmap para Microservicios Demo

Este documento describe detalladamente cómo implementar 7 mejoras clave al proyecto demo de microservicios con Moleculer, SQLite y RabbitMQ.

---

## 1. Dockerización y Orquestación

### Descripción
Empaquetar los servicios en contenedores Docker y orquestarlos con `docker-compose` para un despliegue unificado.

### Implementación

#### 1.1 Crear Dockerfile para los servicios

Crear un archivo `Dockerfile` en la raíz del proyecto:

\`\`\`dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
\`\`\`

#### 1.2 Crear docker-compose.yml

\`\`\`yaml
version: '3.8'

services:
  rabbitmq:
    image: rabbitmq:3-management
    container_name: demo-rabbitmq
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      RABBITMQ_DEFAULT_USER: guest
      RABBITMQ_DEFAULT_PASS: guest
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    healthcheck:
      test: rabbitmq-diagnostics -q ping
      interval: 10s
      timeout: 5s
      retries: 5

  user:
    build: .
    container_name: demo-user-service
    environment:
      SERVICE_NAME: user
      RABBITMQ_URL: amqp://guest:guest@rabbitmq:5672
    volumes:
      - ./services/user:/app/services/user
      - user_db:/app/services/user
    depends_on:
      rabbitmq:
        condition: service_healthy

  auth:
    build: .
    container_name: demo-auth-service
    environment:
      SERVICE_NAME: auth
    volumes:
      - ./services/auth:/app/services/auth
      - auth_db:/app/services/auth
    depends_on:
      rabbitmq:
        condition: service_healthy

  email:
    build: .
    container_name: demo-email-service
    environment:
      SERVICE_NAME: email
      RABBITMQ_URL: amqp://guest:guest@rabbitmq:5672
    volumes:
      - ./services/email:/app/services/email
      - email_db:/app/services/email
    depends_on:
      rabbitmq:
        condition: service_healthy

volumes:
  rabbitmq_data:
  user_db:
  auth_db:
  email_db:
\`\`\`

#### 1.3 Actualizar package.json

Agregar scripts:

\`\`\`json
"scripts": {
  "docker:up": "docker-compose up",
  "docker:down": "docker-compose down",
  "docker:rebuild": "docker-compose up --build"
}
\`\`\`

---

## 2. Health Checks y Métricas

### Descripción
Agregar endpoints de health check y exponer métricas básicas para monitoreo.

### Implementación: Crear `services/shared/healthCheck.js`

\`\`\`javascript
export function createHealthCheckAction(config = {}) {
  return {
    async health(ctx) {
      const uptime = process.uptime();
      const memory = process.memoryUsage();
      
      try {
        if (config.check) {
          await config.check();
        }
        return {
          status: 'healthy',
          service: config.serviceName || 'unknown',
          uptime,
          memory: {
            heapUsed: Math.round(memory.heapUsed / 1024 / 1024) + ' MB',
            heapTotal: Math.round(memory.heapTotal / 1024 / 1024) + ' MB',
          },
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        return {
          status: 'unhealthy',
          service: config.serviceName || 'unknown',
          error: error.message,
          timestamp: new Date().toISOString(),
        };
      }
    },
  };
}
\`\`\`

Integrar en cada servicio:

\`\`\`javascript
import { createHealthCheckAction } from '../shared/healthCheck.js';

actions: {
  ...createHealthCheckAction({ serviceName: 'user' }),
  // ... otras acciones
}
\`\`\`

---

## 3. Autenticación Mejorada (JWT)

### Descripción
Implementar JWT para autenticación distribuida más segura.

### Instalación
\`\`\`bash
npm install jsonwebtoken bcryptjs
\`\`\`

### Crear `services/shared/jwt.js`

\`\`\`javascript
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-prod';

export function generateToken(payload, expiresIn = '24h') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}
\`\`\`

### Actualizar auth.service.js

\`\`\`javascript
async login(ctx) {
  const { username, password } = ctx.params;
  const user = await get(db, 'SELECT id, username FROM users WHERE username = ? AND password = ?', [username, password]);
  
  if (!user) {
    return { success: false, message: 'Invalid credentials' };
  }

  const token = generateToken({ userId: user.id, username: user.username });
  return {
    success: true,
    message: 'Login successful',
    token,
    expiresIn: '24h',
  };
}
\`\`\`

---

## 4. Tests Básicos

### Descripción
Agregar tests con Jest para validar funcionamiento.

### Instalación
\`\`\`bash
npm install --save-dev jest
\`\`\`

### Crear `jest.config.js`

\`\`\`javascript
export default {
  testEnvironment: 'node',
  collectCoverageFrom: ['services/**/*.js', 'index.js'],
  coveragePathIgnorePatterns: ['/node_modules/', '*.db'],
  testMatch: ['**/__tests__/**/*.test.js'],
};
\`\`\`

### Ejemplo test: `services/user/__tests__/user.service.test.js`

\`\`\`javascript
import UserService from '../user.service.js';

describe('User Service', () => {
  beforeAll(async () => {
    await UserService.start();
  });

  afterAll(async () => {
    await UserService.stop();
  });

  test('should create a user', async () => {
    const result = await UserService.call('user.createUser', {
      username: 'testuser',
      email: 'test@example.com',
    });
    expect(result).toHaveProperty('id');
    expect(result.username).toBe('testuser');
  });

  test('should get all users', async () => {
    const result = await UserService.call('user.getUsers');
    expect(Array.isArray(result)).toBe(true);
  });
});
\`\`\`

### Scripts en package.json

\`\`\`json
"scripts": {
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage"
}
\`\`\`

---

## 5. API Gateway y Documentación

### Descripción
Crear un API Gateway centralizado con Swagger/OpenAPI.

### Instalación
\`\`\`bash
npm install moleculer-web swagger-ui-express swagger-jsdoc
\`\`\`

### Crear `services/gateway/gateway.service.js`

\`\`\`javascript
import { ServiceBroker } from 'moleculer';
import ApiService from 'moleculer-web';

const broker = new ServiceBroker();

broker.createService({
  ...ApiService,
  settings: {
    port: 3000,
    ip: '0.0.0.0',
    aliases: {
      'POST /auth/login': 'auth.authUser',
      'GET /user/list': 'user.getUsers',
      'POST /user/create': 'user.createUser',
      'GET /health': 'gateway.health',
    },
  },
  actions: {
    health: {
      async handler() {
        return { status: 'ok' };
      },
    },
  },
});

export default broker;
\`\`\`

---

## 6. Logging Estructurado

### Descripción
Reemplazar console.log con Winston logger.

### Instalación
\`\`\`bash
npm install winston
\`\`\`

### Crear `services/shared/logger.js`

\`\`\`javascript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

export default logger;
\`\`\`

### Usar en servicios

\`\`\`javascript
import logger from '../shared/logger.js';

async createUser(ctx) {
  try {
    logger.info('Creating user', { username: ctx.params.username });
    // ... lógica
    logger.info('User created', { userId: result.id });
  } catch (error) {
    logger.error('Failed to create user', { error: error.message });
  }
}
\`\`\`

---

## 7. Configuración Externa (.env)

### Descripción
Mover hardcoded values a variables de entorno.

### Instalación
\`\`\`bash
npm install dotenv
\`\`\`

### Crear `.env.example`

\`\`\`
RABBITMQ_URL=amqp://localhost
JWT_SECRET=your-secret-key
LOG_LEVEL=info
NODE_ENV=development
\`\`\`

### Usar en index.js

\`\`\`javascript
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost';
\`\`\`

### Actualizar .gitignore

\`\`\`
.env
.env.local
\`\`\`

---

## Orden de Implementación Recomendado

1. **Configuración externa** (30 min)
2. **Dockerización** (2 horas)
3. **Health Checks** (30 min)
4. **Logging** (1 hora)
5. **Tests** (2 horas)
6. **JWT** (1.5 horas)
7. **API Gateway** (1.5 horas)
