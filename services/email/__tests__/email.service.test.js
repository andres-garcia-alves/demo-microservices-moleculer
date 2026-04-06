import { ServiceBroker } from 'moleculer';
import createEmailService from '../email.service.js';

describe('Email Service', () => {
  let broker;

  beforeAll(async () => {
    broker = new ServiceBroker({
      logger: false,
      transporter: 'fake',
    });
    broker.createService(createEmailService(broker));
    await broker.start();
  });

  afterAll(async () => {
    await broker.stop();
  });

  test('sendEmail returns a confirmation message', async () => {
    const result = await broker.call('email.sendEmail', {
      recipient: 'test@example.com',
      subject: 'Welcome',
      content: 'Hello world',
    });

    expect(result).toBe('Email sent to test@example.com');
  });
});
