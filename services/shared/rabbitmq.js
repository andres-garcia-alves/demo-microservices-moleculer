import amqp from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
let connection;
let channel;
let connected = false;

/**
 * Returns a RabbitMQ channel, creating the connection if needed.
 *
 * @returns {Promise<amqp.Channel>} The active RabbitMQ channel.
 * @throws Will throw if RabbitMQ is not reachable.
 */
export async function getChannel() {
  if (channel) return channel;
  try {
    connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    connected = true;
    return channel;
  } catch (error) {
    connected = false;
    throw error;
  }
}

/**
 * Indicates whether a RabbitMQ connection has been established.
 *
 * @returns {boolean} True when RabbitMQ is connected.
 */
export function isConnected() {
  return connected;
}

/**
 * Publishes a JSON message to the specified RabbitMQ queue.
 *
 * @param {string} queue - The queue name.
 * @param {unknown} message - The message payload.
 * @returns {Promise<void>} Resolves when the message is sent or logs a warning on failure.
 */
export async function publish(queue, message) {
  try {
    const ch = await getChannel();
    await ch.assertQueue(queue, { durable: true });
    ch.sendToQueue(queue, Buffer.from(JSON.stringify(message)), { persistent: true });
  } catch (error) {
    console.warn(`RabbitMQ publish failed (${queue}):`, error.message || error);
  }
}

/**
 * Consumes messages from a RabbitMQ queue and dispatches them to a handler.
 *
 * @param {string} queue - The queue name.
 * @param {(payload: unknown) => Promise<void>} onMessage - Handler for each message payload.
 * @returns {Promise<void>} Resolves when consumer setup is complete.
 */
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

/**
 * Closes the RabbitMQ channel and connection if they exist.
 *
 * @returns {Promise<void>} Resolves once the connection is cleaned up.
 */
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
    connected = false;
  }
}
