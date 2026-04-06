// services/shared/circuit-breaker.js

/**
 * Circuit Breaker implementation for resilient service calls
 * Implements the Circuit Breaker pattern to handle service failures gracefully
 */
export class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.recoveryTimeout = options.recoveryTimeout || 60000; // 1 minute
    this.monitoringPeriod = options.monitoringPeriod || 10000; // 10 seconds

    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN

    // Metrics for monitoring
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rejectedRequests: 0,
      lastStateChange: Date.now()
    };
  }

  /**
   * Execute a function with circuit breaker protection
   * @param {Function} action - The async function to execute
   * @param {Object} context - Context for logging/monitoring
   * @returns {Promise} - Result of the action or throws an error
   */
  async execute(action, context = {}) {
    this.metrics.totalRequests++;

    switch (this.state) {
      case 'OPEN':
        if (this._shouldAttemptReset()) {
          this.state = 'HALF_OPEN';
          this.metrics.lastStateChange = Date.now();
          return this._executeInHalfOpen(action, context);
        } else {
          this.metrics.rejectedRequests++;
          throw new Error(`Circuit breaker is OPEN for ${context.service || 'unknown service'}`);
        }

      case 'HALF_OPEN':
        return this._executeInHalfOpen(action, context);

      case 'CLOSED':
      default:
        return this._executeInClosed(action, context);
    }
  }

  /**
   * Execute action when circuit is CLOSED
   */
  async _executeInClosed(action, context) {
    try {
      const result = await action();
      this._onSuccess();
      return result;
    } catch (error) {
      this._onFailure(error, context);
      throw error;
    }
  }

  /**
   * Execute action when circuit is HALF_OPEN
   */
  async _executeInHalfOpen(action, context) {
    try {
      const result = await action();
      this._onReset();
      return result;
    } catch (error) {
      this._onFailure(error, context);
      throw error;
    }
  }

  /**
   * Handle successful execution
   */
  _onSuccess() {
    this.metrics.successfulRequests++;
    this.failureCount = 0;
    this.lastFailureTime = null;
  }

  /**
   * Handle failed execution
   */
  _onFailure(error, context) {
    this.metrics.failedRequests++;
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.metrics.lastStateChange = Date.now();
      console.warn(`Circuit breaker opened for ${context.service || 'unknown service'} after ${this.failureCount} failures`);
    }
  }

  /**
   * Handle successful reset from HALF_OPEN
   */
  _onReset() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.metrics.lastStateChange = Date.now();
    console.info(`Circuit breaker reset to CLOSED state`);
  }

  /**
   * Check if we should attempt to reset from OPEN state
   */
  _shouldAttemptReset() {
    if (!this.lastFailureTime) return false;
    return (Date.now() - this.lastFailureTime) >= this.recoveryTimeout;
  }

  /**
   * Get current circuit breaker status
   */
  getStatus() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      failureThreshold: this.failureThreshold,
      recoveryTimeout: this.recoveryTimeout,
      lastFailureTime: this.lastFailureTime,
      timeInCurrentState: Date.now() - this.metrics.lastStateChange,
      metrics: { ...this.metrics }
    };
  }

  /**
   * Manually reset the circuit breaker
   */
  reset() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.metrics.lastStateChange = Date.now();
    console.info('Circuit breaker manually reset');
  }

  /**
   * Manually open the circuit breaker
   */
  open() {
    this.state = 'OPEN';
    this.lastFailureTime = Date.now();
    this.metrics.lastStateChange = Date.now();
    console.warn('Circuit breaker manually opened');
  }
}

/**
 * Factory function to create circuit breakers for different services
 */
export const createCircuitBreaker = (serviceName, options = {}) => {
  const breaker = new CircuitBreaker({
    failureThreshold: options.failureThreshold || 3,
    recoveryTimeout: options.recoveryTimeout || 30000,
    monitoringPeriod: options.monitoringPeriod || 10000,
    ...options
  });

  return {
    execute: (action) => breaker.execute(action, { service: serviceName }),
    getStatus: () => breaker.getStatus(),
    reset: () => breaker.reset(),
    open: () => breaker.open()
  };
};