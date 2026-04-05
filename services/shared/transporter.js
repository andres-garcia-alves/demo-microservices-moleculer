import logger from './logger.js';

/**
 * Obtiene la configuración del transporter basada en la variable TRANSPORTER_TYPE.
 * Permite alternar entre TCP (desarrollo) y AMQP (RabbitMQ/producción).
 *
 * @returns {object} Configuración para ServiceBroker
 */
export function getTransporterConfig() {
  const transporterType = (process.env.TRANSPORTER_TYPE || 'TCP').toUpperCase();

  if (transporterType === 'AMQP') {
    const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost';
    logger.info('Using AMQP transporter (RabbitMQ)', { url: rabbitmqUrl });
    return {
      transporter: rabbitmqUrl,
    };
  }

  // Por defecto, TCP
  logger.info('Using TCP transporter (native Moleculer)');
  return {
    transporter: 'TCP',
  };
}
