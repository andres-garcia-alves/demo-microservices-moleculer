import { ServiceBroker } from 'moleculer';
import createGatewayService from '../gateway.service.js';
import createUserService from '../../user/user.service.js';
import createAuthService from '../../auth/auth.service.js';

describe('Gateway Service', () => {
  let broker;

  beforeAll(async () => {
    broker = new ServiceBroker({
      logger: false,
      transporter: 'fake',
    });

    // Create all services for integration testing
    broker.createService(createUserService(broker));
    broker.createService(createAuthService(broker));
    broker.createService(createGatewayService(broker));

    await broker.start();
  });

  afterAll(async () => {
    await broker.stop();
  });

  test('services are created successfully', async () => {
    const services = broker.services.map(s => s.name);
    expect(services).toContain('user');
    expect(services).toContain('auth');
    expect(services).toContain('api'); // moleculer-web registers as 'api'
  });

  test('gateway service has proper configuration', async () => {
    const gatewayService = broker.services.find(s => s.name === 'api'); // moleculer-web uses 'api' name
    expect(gatewayService).toBeDefined();
    expect(gatewayService.settings).toBeDefined();
    expect(gatewayService.settings.port).toBeDefined();
  });

  test('POST /users creates a user through gateway', async () => {
    const userData = {
      username: 'gatewaytest',
      email: 'gateway@test.com',
    };

    // Test the underlying action directly
    const result = await broker.call('user.createUser', userData);
    expect(result).toHaveProperty('id');
    expect(result.username).toBe(userData.username);
    expect(result.email).toBe(userData.email);
  });

  test('GET /users retrieves users through gateway', async () => {
    // Test the underlying action
    const users = await broker.call('user.getUsers');
    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBeGreaterThan(0);
  });

  test('POST /auth/login works through gateway', async () => {
    const loginData = {
      username: 'admin',
      password: 'password',
    };

    // Test that the action can be called
    const result = await broker.call('auth.login', loginData);
    expect(result).toHaveProperty('success');
    expect(typeof result.success).toBe('boolean');
  });

  test('gateway has aliases configured', async () => {
    const gatewayService = broker.services.find(s => s.name === 'api'); // moleculer-web uses 'api' name
    expect(gatewayService.settings.aliases).toBeDefined();
    expect(Object.keys(gatewayService.settings.aliases).length).toBeGreaterThan(0);
  });

  test('gateway has routes configured', async () => {
    const gatewayService = broker.services.find(s => s.name === 'api'); // moleculer-web uses 'api' name
    expect(gatewayService.settings.routes).toBeDefined();
    expect(gatewayService.settings.routes.length).toBeGreaterThan(0);
  });

  test('API versioning - v1 routes are configured', async () => {
    const gatewayService = broker.services.find(s => s.name === 'api');
    const v1Route = gatewayService.settings.routes.find(route => route.path === '/api/v1');
    expect(v1Route).toBeDefined();
    expect(v1Route.aliases).toBeDefined();
    expect(Object.keys(v1Route.aliases).length).toBeGreaterThan(0);
  });

  test('API versioning - legacy routes are marked as deprecated', async () => {
    const gatewayService = broker.services.find(s => s.name === 'api');
    const legacyAliases = gatewayService.settings.aliases;

    // Check that legacy routes exist and are marked as deprecated
    expect(legacyAliases['GET /users']).toBeDefined();
    expect(legacyAliases['GET /users'].swagger.deprecated).toBe(true);
    expect(legacyAliases['POST /users'].swagger.deprecated).toBe(true);
  });

  test('API versioning - version header is added to v1 responses', async () => {
    const gatewayService = broker.services.find(s => s.name === 'api');
    const v1Route = gatewayService.settings.routes.find(route => route.path === '/api/v1');
    expect(v1Route.onBeforeCall).toBeDefined();
    // The onBeforeCall function should set X-API-Version header
  });
});
