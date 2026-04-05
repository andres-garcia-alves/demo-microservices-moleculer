# Plan: Configuración Dinámica de Transporter (TCP vs RabbitMQ)

## TL;DR

Implementar una variable de entorno `TRANSPORTER_TYPE` para alternar entre:
- **TCP** (transporte nativo Moleculer) - desarrollo sin RabbitMQ
- **AMQP** (RabbitMQ) - producción con mensajería robusta

---

## Problema

No tenemos RabbitMQ instalado en desarrollo, pero necesitamos:
1. Probar el proyecto sin RabbitMQ
2. Tener código listo para RabbitMQ en producción
3. Cambiar transportes sin modificar código

---

## Solución

### Arquitectura

```
TRANSPORTER_TYPE (env variable)
    |
    ├─ "TCP" → Transporte nativo Moleculer
    └─ "AMQP" → RabbitMQ
        |
        → getTransporterConfig() (helper)
            |
            → Retorna configuración dinámica
                |
                → Servicios usan la configuración
                   ├─ user.service.js
                   ├─ auth.service.js
                   ├─ email.service.js
                   └─ gateway.service.js
```

---

## Implementación

### Fase 1: Crear `services/shared/transporter.js`

```javascript
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
```

### Fase 2: Actualizar 4 Servicios

Cambio en cada archivo (user, auth, email, gateway):

**Agregar import:**
```javascript
import { getTransporterConfig } from '../shared/transporter.js';
```

**Cambiar broker:**
```javascript
// Antes:
const broker = new ServiceBroker({ transporter: 'TCP' });

// Después:
const broker = new ServiceBroker(getTransporterConfig());
```

### Fase 3: Actualizar `.env.example`

Agregar después de `RABBITMQ_URL`:
```
# Transporter configuration
# Options: 'TCP' (default - no external dependencies), 'AMQP' (requires RabbitMQ)
TRANSPORTER_TYPE=TCP
```

---

## Archivos a Modificar

| Archivo | Acción |
|---------|--------|
| `services/shared/transporter.js` | Crear |
| `services/user/user.service.js` | Agregar import + actualizar broker |
| `services/auth/auth.service.js` | Agregar import + actualizar broker |
| `services/email/email.service.js` | Agregar import + actualizar broker |
| `services/gateway/gateway.service.js` | Agregar import + actualizar broker |
| `.env.example` | Agregar variable |

---

## Testing

### Test 1: TCP (Sin RabbitMQ)
```bash
TRANSPORTER_TYPE=TCP npm start
# ✅ Debe funcionar sin errores
```

### Test 2: AMQP (Con RabbitMQ - opcional)
```bash
# Primero: docker run -d -p 5672:5672 rabbitmq:3
TRANSPORTER_TYPE=AMQP npm start
# ✅ Debe conectarse a RabbitMQ
```

---

## Beneficios

✅ Desarrollo sin RabbitMQ instalado
✅ Código listo para RabbitMQ en producción
✅ Un solo cambio = variable de entorno
✅ Sin cambios en lógica de servicios
✅ Extensible a otros transportes (NATS, Kafka, Redis)

---

## Compatibilidad

| Característica | TCP | AMQP |
|---|---|---|
| Comunicación sincrónica | ✅ | ✅ |
| Eventos | ✅ | ✅ |
| Escalabilidad | ⚠️ | ✅ |
| Persistencia | ❌ | ✅ |
| Instalación requerida | No | Sí (RabbitMQ) |

---

## Timeline

- Crear transporter.js: 5 min
- Actualizar 4 servicios: 8 min
- Actualizar .env: 3 min
- Testing: 10-15 min
- **Total: ~40 minutos**

---

## Escenarios de Uso

| Escenario | TRANSPORTER_TYPE | Razón |
|---|---|---|
| Desarrollo local | TCP | Sin dependencias |
| Tests unitarios | TCP | Aislado, rápido |
| Demo/POC | TCP | Portátil |
| Staging | AMQP | Similar a producción |
| Producción | AMQP | Escalable, confiable |

---

## Impacto en Código

✅ **Sin cambios:**
- Lógica de negocio
- Acciones (createUser, login, etc.)
- Eventos (user.created)
- API Gateway routes
- Base de datos (SQLite)

✅ **Con cambios (mínimos):**
- Instanciación de brokers (+1 import, +1 línea)
- Variables de entorno (+1 variable)

---

## Migración Futura

El código está listo para soportar Kafka u otros transportes:

```javascript
if (transporterType === 'KAFKA') {
  return { transporter: 'Kafka' };
}
```

Sin bifurcación de código ni cambios en servicios.
