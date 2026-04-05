import { ServiceBroker } from 'moleculer';
import ApiService from 'moleculer-web';

const broker = new ServiceBroker({
  transporter: 'TCP',
});

broker.createService({
  ...ApiService,
  settings: {
    port: process.env.GATEWAY_PORT || 3000,
    ip: '0.0.0.0',
    swagger: {
      ui: true,
      info: {
        title: 'Demo Microservices API',
        version: '1.0.0',
        description: 'API Gateway for Moleculer microservices demo',
      },
    },
    aliases: {
      'POST /auth/login': {
        action: 'auth.login',
        swagger: {
          summary: 'Authenticate user',
          tags: ['Authentication'],
          body: {
            username: { type: 'string', required: true },
            password: { type: 'string', required: true },
          },
        },
      },
      'GET /users': {
        action: 'user.getUsers',
        swagger: {
          summary: 'Get all users',
          tags: ['Users'],
        },
      },
      'POST /users': {
        action: 'user.createUser',
        swagger: {
          summary: 'Create a new user',
          tags: ['Users'],
          body: {
            username: { type: 'string', required: true },
            email: { type: 'string', required: true },
          },
        },
      },
      'GET /health': {
        action: 'gateway.health',
        swagger: {
          summary: 'Health check',
          tags: ['Health'],
        },
      },
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