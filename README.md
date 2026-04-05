# Microservices Example

Simple example of how to create microservices with the [Moleculer framework](https://moleculer.services).

This is the code from the [Microservices Crash Course](https://youtu.be/fEDT4lWWe9g) on YouTube. There are 3 very simple services (user, email, auth) with actions to mock/simulate creating a user, getting users, sending an email and authenticating a user.

## Usage

Install dependencies first:

```bash
npm install
```

Run the services:

```bash
npm start
```

> Nota: este demo usa RabbitMQ para mensajería entre servicios y cada microservicio guarda datos en su propia base SQLite local.
>
> Si RabbitMQ no está disponible, los servicios igualmente arrancan y `user` persiste usuarios en SQLite, pero los eventos `user.created` no llegarán al servicio `email`.
