/* eslint-disable prettier/prettier */
// const { PrismaClient } = require('@prisma/client');

// const prisma = new PrismaClient({
//   log: ['query'],
// });

// module.exports = {
//   prisma,
// };

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = {
  prisma,
};
