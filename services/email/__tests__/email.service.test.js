import EmailService from '../email.service.js';

describe('Email Service', () => {
  beforeAll(async () => {
    await EmailService.start();
  });

  afterAll(async () => {
    await EmailService.stop();
  });

  test('sendEmail returns a confirmation message', async () => {
    const result = await EmailService.call('email.sendEmail', {
      recipient: 'test@example.com',
      subject: 'Welcome',
      content: 'Hello world',
    });

    expect(result).toBe('Email sent to test@example.com');
  });
});
