import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { isShuttingDown, setupGracefulShutdown, _resetShutdownState } from '../graceful-shutdown.js';

describe('graceful-shutdown', () => {
  beforeEach(() => {
    _resetShutdownState();
  });

  afterEach(() => {
    // Remove registered signal listeners after each test to avoid leaks
    process.removeAllListeners('SIGTERM');
    process.removeAllListeners('SIGINT');
    _resetShutdownState();
  });

  test('isShuttingDown returns false initially', () => {
    expect(isShuttingDown()).toBe(false);
  });

  test('setupGracefulShutdown registers SIGTERM and SIGINT listeners', () => {
    const broker = { stop: vi.fn().mockResolvedValue() };
    const sigtermBefore = process.listenerCount('SIGTERM');
    const sigintBefore = process.listenerCount('SIGINT');

    setupGracefulShutdown(broker, { gracePeriodMs: 0 });

    expect(process.listenerCount('SIGTERM')).toBe(sigtermBefore + 1);
    expect(process.listenerCount('SIGINT')).toBe(sigintBefore + 1);
  });

  test('shutdown sequence stops the broker and exits', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
    const broker = { stop: vi.fn().mockResolvedValue() };

    setupGracefulShutdown(broker, { gracePeriodMs: 0 });

    // Emit SIGTERM to trigger shutdown
    process.emit('SIGTERM');

    // Wait for the async shutdown to complete
    await vi.waitFor(() => expect(exitSpy).toHaveBeenCalledWith(0), { timeout: 3000 });

    expect(isShuttingDown()).toBe(true);
    expect(broker.stop).toHaveBeenCalledTimes(1);

    exitSpy.mockRestore();
  });

  test('double signal does not call broker.stop twice', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
    const broker = { stop: vi.fn().mockResolvedValue() };

    setupGracefulShutdown(broker, { gracePeriodMs: 0 });

    process.emit('SIGTERM');
    process.emit('SIGTERM');

    await vi.waitFor(() => expect(exitSpy).toHaveBeenCalledWith(0), { timeout: 3000 });

    expect(broker.stop).toHaveBeenCalledTimes(1);

    exitSpy.mockRestore();
  });

  test('broker.stop error is handled without throwing', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
    const broker = { stop: vi.fn().mockRejectedValue(new Error('stop failed')) };

    setupGracefulShutdown(broker, { gracePeriodMs: 0 });

    process.emit('SIGTERM');

    await vi.waitFor(() => expect(exitSpy).toHaveBeenCalledWith(0), { timeout: 3000 });

    exitSpy.mockRestore();
  });
});
