import amqp from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
let connection;
let channel;

export async function getChannel() {
  if (channel) return channel;
  connection = await amqp.connect(RABBITMQ_URL);
  channel = await connection.createChannel();
  return channel;
}

export async function publish(queue, message) {
  try {
    const ch = await getChannel();
    await ch.assertQueue(queue, { durable: true });
    ch.sendToQueue(queue, Buffer.from(JSON.stringify(message)), { persistent: true });
  } catch (error) {
    console.warn(`RabbitMQ publish failed (${queue}):`, error.message || error);
  }
}

export async function consume(queue, onMessage) {
  try {
    const ch = await getChannel();
    await ch.assertQueue(queue, { durable: true });
    await ch.consume(queue, async (msg) => {
      if (!msg) return;
      try {
        const payload = JSON.parse(msg.content.toString());
        await onMessage(payload);
        ch.ack(msg);
      } catch (error) {
        console.error('RabbitMQ consumer error:', error);
        ch.nack(msg, false, false);
      }
    });
  } catch (error) {
    console.warn(`RabbitMQ consumer setup failed (${queue}):`, error.message || error);
  }
}

export async function closeConnection() {
  try {
    if (channel) {
      await channel.close();
    }
    if (connection) {
      await connection.close();
    }
  } catch (error) {
    console.warn('RabbitMQ close connection warning:', error.message || error);
  } finally {
    channel = undefined;
    connection = undefined;
  }
}
