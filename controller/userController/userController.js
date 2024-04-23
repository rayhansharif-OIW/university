/* eslint-disable max-len */
// external imports
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const createError = require('http-errors');
const ApiError = require('../../utilities/ApiError');

// internal imports

const prisma = require('../../DB/db.config');
const { generateAccessToken, generateRefreshToken, isPasswordCorrect, isPasswordCorrect } = require('../../utilities/functions');
const { asyncHandler } = require('../../utilities/asyncHandler');
const { ApiResponse } = require('../../utilities/ApiResponse');

const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },

    });

    const accesstoken = generateAccessToken(user);
    const refreshtoken = generateRefreshToken(user);
    const updatedUser = await prisma.user.update({
      where: { id: user.id }, // Update based on existing user ID
      data: {
        refreshToken: refreshtoken, // Only update the name field
      },
      select: {
        password: false,
      },
    });

    return { accesstoken, refreshtoken };
  } catch (error) {
    throw createError('Something went wrong to generate tokens');
  }
};

// do login
async function login(req, res, next) {
  try {
    if (!req.email) {
      throw createError('email is required');
    }
    // find a user who has this email
    const user = await prisma.user.findUnique({
      where: {
        email: req.body.email,
      },
    });

    if (user) {
      const isValidPassword = await bcrypt.compare(
        req.body.password,
        user.password,
      );

      if (isValidPassword) {
        const { accesstoken, refreshtoken } = await generateAccessAndRefereshTokens(user);

        // neeed updated user
        const logedInUser = await prisma.user.findUnique({
          where: {
            email: req.body.email,
          },
          select: {
            password: false,
            refreshToken: false,
          },
        });

        // set cookie
        res.cookie(process.env.ACCESSTOKEN_COOKIE_NAME, accesstoken, {
          maxAge: process.env.JWT_EXPIRY,
          httpOnly: true,
          signed: true,
        }).cookie(process.env.REFRESHTOKEN_COOKIE_NAME, refreshtoken, {
          maxAge: process.env.JWT_EXPIRY,
          httpOnly: true,
          signed: true,
        });

        // set logged in user local identifier
        res.locals.loggedInUser = logedInUser;
        res.json({
          status: 'success',
          msg: 'User logged In Successfully',
          redirect: 'inbox',
          user: logedInUser,
          accesstoken,
          refreshtoken,

         });
      } else {
        throw createError('Login failed! Please try again.');
      }
    } else {
      throw createError('Login failed! User not registerd.');
    }
  } catch (err) {
    res.json({
      data: {
        email: req.body.email,
      },
      errors: {
        common: {
          msg: err.message,
        },
      },
    });
  }
}

// secure routes
// do logout
const logout = asyncHandler(async (req, res, next) => {
  const user = await prisma.user.findUnique({
    where: {
      id: req.user.id,
    },
  });
  const updatedUser = {
    ...req.user,
    refreshToken: undefined,
  };
  const logOutUser = prisma.user.update({
    where: {
      id: req.user.id,
    },
    data: updatedUser,
    select: {
      password: false,
    },
  });

  return res
  .status(200)
  .clearCookie(process.env.ACCESSTOKEN_COOKIE_NAME)
  .clearCookie(process.env.REFRESHTOKEN_COOKIE_NAME)
  .json(
    new ApiResponse(200, {}, 'User logged Out'),
  );
});

// refreshAccessToken
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw ApiError(401, 'unothorized request');
  }
  try {
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await prisma.user.findUnique({
      where: {
        id: decodedToken?.id,
      },
    });

    if (!user) {
      throw new ApiError(401, 'Invalid refreshToken');
    }
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, 'refreshToken is expaired');
    }
    const { accesstoken, newRefreshtoken } = await generateAccessAndRefereshTokens(user);
       // set cookie
       res.cookie(process.env.ACCESSTOKEN_COOKIE_NAME, accesstoken, {
        maxAge: process.env.JWT_EXPIRY,
        httpOnly: true,
        signed: true,
      }).cookie(process.env.REFRESHTOKEN_COOKIE_NAME, newRefreshtoken, {
        maxAge: process.env.JWT_EXPIRY,
        httpOnly: true,
        signed: true,
      }).json(
        new ApiResponse(200, { accesstoken, newRefreshtoken }, 'AccessToken refreshed'),
      );
  } catch (error) {
    throw new ApiError(401, error ? error.message : 'Invalid refresh token');
  }
});

// change Current password
const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await prisma.user.findUnique({
    where: {
      id: req.user?.id,
    },
  });

  const isPasswordCorrect = await isPasswordCorrect(user);
  if (!isPasswordCorrect) {
    throw new ApiError(400, ' Invalid Old Password');
  }
  const encriptedNewPassword = await bcrypt.hash(newPassword, 10);
  const updatedUser = {
    ...user,
    password: encriptedNewPassword,

  };
  const updatedUserDetails = await prisma.user.update({
    where: { id: user.Id },
    data: updatedUser,
    select: {
        id: true,
        username: true,
        email: true,
        age: false, // Exclude the age field
        // Exclude any other fields you don't want in the response
    },
  });

  if(updatedUserDetails){
    return res.status(200)
  .json(new ApiResponse(200, {}, 'password change successfully'));

  }else{
    throw new ApiError(401, 'Change password failed');

  }

  
});

const updateAccountDetails = asyncHandler(async()=>{
  const {name,email} = req.body
  if(!(name || email)){
    throw new ApiError(400, error ? error.message : 'All fields are required');
  }

  const user = await prisma.user.findUnique({
    where: {
      id: req.user?.id,
    },
  });

  const updatedUser = {
    ...user,
    name:name ,
    email:email,

  };
  const updatedUserDetails = await prisma.user.update({
    where: { id: user.Id },
    data: {name: name, email:email},
    select: {
        id: true,
        username: true,
        email: true,
        age: false, // Exclude the age field
        // Exclude any other fields you don't want in the response
    },
  });
  if(updatedUserDetails){
    return res.status(200)
  .json(new ApiResponse(200, {}, ' update successful'));

  }else{
    throw new ApiError(401, 'update failed');

  }

})

const updateUserAvater= asyncHandler(async(req,res)=>{
  const avaterUrl = req.cloudinaryReturn
  if(!avaterUrl){
    throw new ApiError(400, ' Image not found'); 
  }
  const user = await prisma.user.findUnique({
    where: {
      id: req.user?.id,
    },
  });
  const {avater} = user;
  
  const newAvatar = [avaterUrl,...avater]
  
  const updatedUserDetails = await prism.user.update({
    where: { id: user.id }, // assuming 'user' is the object containing user details
    data: { avatar: newAvatar }, // assuming 'updatedAvatar' contains the new avatar data
    select: {
      id: true,
      username: true,
      email: true,
      age: true, // Include age if needed
      // Include any other fields you want in the response
    },
  });
  if(updatedUserDetails){
    return res.status(200)
  .json(new ApiResponse(200, {}, ' update successful'));

  }else{
    throw new ApiError(401, 'update failed');
  }

})

const getUserChannelProfile = asyncHandler(async(req,res)=>{
  const {username} = req.params
  if(!username?.trim()){
    throw new ApiError(400, "username is missing")
  }

  const user = await prisma.user.findUnique({
    where: { username: username?.toLowerCase() },
    select: {
      id: true,
      name: true,
      avatar: true,
      email: true,
      profile: true,
      _count: {
        select: { subscriptions: true, subscribedTo: true },
      },
      subscriptions: {
        select: { subscriber: { select: { id: true } } },
        where: { subscriberId: req.user?.id },
      },
    },
  });
  const isSubscribed = user.subscriptions.some(
    (subscription) => subscription.subscriber.id === req.user?.id
  );

  const channelData = {
    ...user,
    subscribersCount: user._count.subscriptions,
    channelsSubscribedToCount: user._count.subscribedTo,
    isSubscribed,
  };

  if (!channelData?.length) {
    throw new ApiError(404, "channel does not exists")
  }

  return res
  .status(200)
  .json(
    new ApiResponse(200, channelData[0], "User channel fetched successfully")
  )
})

const getWatchHistory = asyncHandler(async(req,res)=>{
  const user = await prisma.user.findUnique({
    where: { id: req.user?.id }, // Assuming user id is stored in req.user.id
    select: {
      watchHistory: {
        where: { published: true }, // Filter videos based on isPublished
        select: {
          id: true, // Include video ID for watch history
          owner: {
            select: {
              fullName: true,
              username: true,
              avatar: true,
            },
          },
        },
      },
    },
  });
  const watchedVideos = user.watchHistory.map((video) => ({
    ...video,
    owner: video.owner ? video.owner : null, // Handle potential null owner
  }));
  if (!watchedVideos?.length) {
    throw new ApiError(404, "Empty")
  }
  return res
  .status(200)
  .json(
    new ApiResponse(200, channelData, "User watch history fetched successfully")
  )

})


const createCompleteProfile = asyncHandler(async (req, res, next) => {
  const {
      userId,
      firstName,
      lastName,
      middleName,
      email,
      phoneNumber,
      summary,
      education,
      skills,
      experience,
      certifications,
    } = req.body;

  // // Create education records
  // const createdEducation = await prisma.education.createMany({
  //     data: education.map((edu) => ({ ...edu, profileId: userId })),
  //   });

  //     // Create experience records
  // const createdExperience = await prisma.experience.createMany({
  //     data: experience.map((exp) => ({ ...exp, profileId: userId })),
  //    });

  // // Create certification records
  // const createdCertifications = await prisma.certification.createMany({
  //     data: certifications.map((cert) => ({ ...cert, profileId: userId })),
  //     });

  const userProfile = await prisma.profile.create({
    data: {
      user: { connect: { id: userId } },
      firstName,
      lastName,
      middleName,
      email,
      phoneNumber,
      summary,
      education: { createMany: { data: education } },
      skills,
      experience: { createMany: { data: experience } },
      certifications: { createMany: { data: certifications } },
    },
    include: {
      education: true,
      experience: true,
      certifications: true,
    },
  });

  return res
  .status(200)
  .json(
    new ApiResponse(200, userProfile, 'User profile create successfully'),
  );
});
const getAllUser = asyncHandler(async (req, res, next) => {
  
  try {
    // Query all users from the database
    const allUsers = await prism.user.findMany();

    // If there are no users, return a 404 error
    if (!allUsers || allUsers.length === 0) {
      return res.status(404).json({ message: 'No users found' });
    }

    // Return the fetched users
    res.status(200).json({ users: allUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});


module.exports = {
  getAllUser,
  createCompleteProfile,
  getUserChannelProfile,
  getWatchHistory,
  updateUserAvater,
  updateAccountDetails,
  changeCurrentPassword,
  refreshAccessToken,
  login,
  logout,
};
