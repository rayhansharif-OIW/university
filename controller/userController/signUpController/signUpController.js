const bcrypt = require('bcrypt');
// const { body } = require('express-validator');
const { prisma } = require('../../../DB/db.config');
// add user

async function addUser(req, res, next) {
  console.log('strep 5');
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    try {
        const user = await prisma.user.create({
          data: {
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword,
            avatar: req.cloudinaryReturn ? req.cloudinaryReturn : [],
          },
          select: {
            email: true,
            name: true,
            avatar: true,
          },
        });

        console.log('User created:', user);
        res.status(200).json({
          userName: user.name,
          email: user.email,
          avatar: user.avatar,

        });
      } catch (error) {
        console.error('Error creating user:', error);
        // res.status(500).json({
        //     error: {
        //       common: {
        //         msg: error.message,
        //       },
        //     },
        //   });
        next(error);
      } finally {
        await prisma.$disconnect(); // Disconnect from the database
      }
}

module.exports = {
  addUser,

};
