import logger from './logger.js';

let shuttingDown = false;

/**
 * Returns true if a graceful shutdown is in progress.
 *
 * @returns {boolean}
 */
export function isShuttingDown() {
  return shuttingDown;
}

/**
 * Registers SIGTERM and SIGINT handlers that stop the broker and exit cleanly.
 * Once shutdown begins, subsequent signals are ignored.
 *
 * @param {import('moleculer').ServiceBroker} broker - The Moleculer broker to stop.
 * @param {object} [options]
 * @param {number} [options.gracePeriodMs=5000] - Milliseconds to wait for in-flight requests before stopping.
 */
export function setupGracefulShutdown(broker, options = {}) {
  const { gracePeriodMs = 5000 } = options;

  const shutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;

    logger.info(`Received ${signal}. Starting graceful shutdown (grace period: ${gracePeriodMs}ms)...`);

    // Allow in-flight requests to complete
    await new Promise((resolve) => setTimeout(resolve, gracePeriodMs));

    try {
      await broker.stop();
      logger.info('Broker stopped successfully. Exiting.');
    } catch (err) {
      logger.error('Error while stopping broker during shutdown', err);
    } finally {
      process.exit(0);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  logger.info('Graceful shutdown handlers registered (SIGTERM, SIGINT).');
}

/**
 * Resets the shutdown flag. Intended for use in tests only.
 *
 * @internal
 */
export function _resetShutdownState() {
  shuttingDown = false;
}
