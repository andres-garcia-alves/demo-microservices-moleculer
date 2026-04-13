import { isShuttingDown } from './graceful-shutdown.js';

/**
 * Returns a Moleculer action object that exposes a standard health check endpoint.
 *
 * @param {object} config
 * @param {string} config.serviceName - Service name used in the health payload.
 * @param {import('moleculer').ActionHandler} [config.check] - Optional async function to perform extra checks.
 * @returns {{health: {handler: import('moleculer').ActionHandler}}}
 */
export function createHealthCheckAction(config = {}) {
  return {
    async health(ctx) {
      const uptime = process.uptime();
      const memory = process.memoryUsage();

      if (isShuttingDown()) {
        return {
          status: 'shutting_down',
          service: config.serviceName || 'unknown',
          uptime,
          timestamp: new Date().toISOString(),
        };
      }

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
