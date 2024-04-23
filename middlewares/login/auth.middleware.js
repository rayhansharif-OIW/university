const jwt = require('jsonwebtoken');
const { ApiError } = require('../../utilities/ApiError');
const { asyncHandler } = require('../../utilities/asyncHandler');

const { prisma } = require('../../DB/db.config');

const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header('Authorization')?.replace('Bearer ', '');

        // console.log(token);
        if (!token) {
            throw new ApiError(401, 'Unauthorized request');
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await prisma.user.findUnique({
            where: {
              id: decodedToken?.id,
            },
            select: {
              id: true,
              username: true, // include other fields you need except password and refreshToken
              // you can omit the fields you don't need to select
            },
          });

        if (!user) {
            throw new ApiError(401, 'Invalid Access Token');
        }

        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || 'Invalid access token');
    }
});

module.exports = {
    verifyJWT,
  };
