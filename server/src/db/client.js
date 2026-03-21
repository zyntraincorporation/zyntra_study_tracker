const { PrismaClient } = require('@prisma/client');

// Singleton pattern — prevents multiple client instances in development
// (hot reload would create a new connection on every file save otherwise)
let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['query', 'warn', 'error'],
    });
  }
  prisma = global.__prisma;
}

module.exports = prisma;
