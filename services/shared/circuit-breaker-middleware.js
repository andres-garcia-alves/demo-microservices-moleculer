// services/shared/circuit-breaker-middleware.js
import { createCircuitBreaker } from './circuit-breaker.js';

/**
 * Moleculer middleware that adds circuit breaker protection to service calls
 */
export const CircuitBreakerMiddleware = (options = {}) => {
  // Store circuit breakers per service
  const circuitBreakers = new Map();

  return {
    name: 'CircuitBreaker',

    created(broker) {
      // Create circuit breakers for known services
      const services = ['user', 'auth', 'email'];

      services.forEach(serviceName => {
        circuitBreakers.set(serviceName, createCircuitBreaker(serviceName, {
          failureThreshold: options.failureThreshold || 3,
          recoveryTimeout: options.recoveryTimeout || 30000,
        }));
      });
    },

    call(next) {
      return async (actionName, params, opts) => {
        const serviceName = actionName.split('.')[0];

        if (circuitBreakers.has(serviceName)) {
          const breaker = circuitBreakers.get(serviceName);

          return await breaker.execute(async () => {
            return await next(actionName, params, opts);
          });
        }

        // If no circuit breaker for this service, proceed normally
        return await next(actionName, params, opts);
      };
    },

    // Add circuit breaker status to health checks
    actions: {
      'circuit-breaker.status': {
        async handler(ctx) {
          const status = {};
          for (const [serviceName, breaker] of circuitBreakers) {
            status[serviceName] = breaker.getStatus();
          }
          return status;
        }
      }
    }
  };
};