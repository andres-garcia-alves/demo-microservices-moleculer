# Project Guidelines

## Code Style
- Use ES6 modules (import/export) as configured in package.json
- Follow the service file naming: `{entity}.service.js`
- Reference [services/user.service.js](services/user.service.js) for code structure patterns

## Architecture
- Moleculer microservices framework (v0.15.0)
- Each service in `services/` directory with separate broker instances
- **Important**: Services create individual brokers; inter-service calls work through the main [index.js](index.js) orchestrator
- Service actions follow `{service}.{action}` naming (e.g., `user.createUser`)

## Build and Test
- Install: `npm install`
- Run: `npm run dev` (starts all services)
- No test suite configured yet

## Conventions
- Service structure: Create broker → define service with name and actions → export broker
- Action parameters: Use `ctx.params` directly (no validation yet)
- Error handling: Basic try/catch in main file
- See [README.md](README.md) for framework reference and usage