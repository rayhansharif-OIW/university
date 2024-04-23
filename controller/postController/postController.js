const { prisma } = require('../../DB/db.config');
const { ApiError } = require('../../utilities/ApiError');
const { ApiResponse } = require('../../utilities/ApiResponse');
const { asyncHandler } = require('../../utilities/asyncHandler');

// const createCompleteProfile = asyncHandler(async (req, res, next) => {
//     const {
//         userId,
//         firstName,
//         lastName,
//         middleName,
//         email,
//         phoneNumber,
//         summary,
//         education,
//         skills,
//         experience,
//         certifications,
//       } = req.body;

//     // Create education records
//     const createdEducation = await prisma.education.createMany({
//         data: education.map((edu) => ({ ...edu, profileId: userId })),
//       });

//         // Create experience records
//     const createdExperience = await prisma.experience.createMany({
//         data: experience.map((exp) => ({ ...exp, profileId: userId })),
//        });

//     // Create certification records
//     const createdCertifications = await prisma.certification.createMany({
//         data: certifications.map((cert) => ({ ...cert, profileId: userId })),
//         });

//     const userProfile = await prisma.profile.create({
//       data: {
//         user: { connect: { id: userId } },
//         firstName,
//         lastName,
//         middleName,
//         email,
//         phoneNumber,
//         summary,
//         education: { createMany: { data: education } },
//         skills,
//         experience: { createMany: { data: experience } },
//         certifications: { createMany: { data: certifications } },
//       },
//       include: {
//         education: true,
//         experience: true,
//         certifications: true,
//       },
//     });

//     return res
//     .status(200)
//     .json(
//       new ApiResponse(200, userProfile, 'User profile create successfully'),
//     );
// });

// create post @@@@@@@@@@@@@@@@@
const createPost = asyncHandler(async (req, res, next) => {
  try {
    const {
 userId, title, description,
} = req.body;
  const images = req.cloudinaryReturn ?? [];
    const post = await prisma.post.create({
      data: {
        user_id: userId,
        title,
        description,
        images,
      },
    });
    res.status(201).json(post);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});
const editPost = asyncHandler(async (req, res, next) => {
  try {
    const {
 postId, title, description,
} = req.body;
const images = req.cloudinaryReturn ?? [];
    const post = await prisma.post.update({
      where: {
        id: postId,
      },
      data: {
        title,
        description,
        images,
      },
    });
    res.status(200).json(post);
  } catch (error) {
    console.error('Error editing post:', error);
    res.status(500).json({ error: 'Failed to edit post' });
  }
});
const toggleLikePost = asyncHandler(async (req, res, next) => {
  try {
    const { userId, postId, likeStatus } = req.body;
    let likedPost;

    if (likeStatus) {
      // If likeStatus is true, connect user to likedBy
      likedPost = await prisma.post.update({
        where: {
          id: postId,
        },
        data: {
          likedBy: {
            connect: {
              id: userId,
            },
          },
        },
      });
    } else {
      // If likeStatus is false, disconnect user from likedBy
      likedPost = await prisma.post.update({
        where: {
          id: postId,
        },
        data: {
          likedBy: {
            disconnect: {
              id: userId,
            },
          },
        },
      });
    }

    res.status(200).json(likedPost);
  } catch (error) {
    console.error('Error toggling like status of post:', error);
    res.status(500).json({ error: 'Failed to toggle like status of post' });
  }
});
const addCommentToPost = asyncHandler(async (req, res, next) => {
  try {
    const { commentId, comment } = req.body;
    const editedComment = await prisma.comment.update({
      where: {
        id: commentId,
      },
      data: {
        comment,
      },
    });
    res.status(200).json(editedComment);
  } catch (error) {
    console.error('Error editing comment:', error);
    res.status(500).json({ error: 'Failed to edit comment' });
  }
});
const deleteCommentToPost = asyncHandler(async (req, res, next) => {
  try {
    const { commentId } = req.body;
    await prisma.comment.delete({
      where: {
        id: commentId,
      },
    });
    res.status(204).send(); // No content to send
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});
const editCommentToPost = asyncHandler(async (req, res, next) => {
  try {
    const { userId, postId, comment } = req.body;
    const newComment = await prisma.comment.create({
      data: {
        user_id: userId,
        post_id: postId,
        comment,
      },
    });
    res.status(201).json(newComment);
  } catch (error) {
    console.error('Error adding comment to post:', error);
    res.status(500).json({ error: 'Failed to add comment to post' });
  }
});
const addReplyToComment = asyncHandler(async (req, res, next) => {
  try {
    const { userId, parentId, content } = req.body;
    let newReply;

    // Check if parentId is provided, if not, it's a reply to a comment
    if (!parentId) {
      const { postId, commentId } = req.body;
      newReply = await prisma.reply.create({
        data: {
          user_id: userId,
          post_id: postId,
          comment_id: commentId,
          content,
        },
      });
    } else {
      // It's a reply to a reply
      newReply = await prisma.reply.create({
        data: {
          user_id: userId,
          parent_id: parentId,
          content,
        },
      });
    }

    res.status(201).json(newReply);
  } catch (error) {
    console.error('Error adding reply:', error);
    res.status(500).json({ error: 'Failed to add reply' });
  }
});
const editReplyToComment = asyncHandler(async (req, res, next) => {
  try {
    const { replyId, content } = req.body;
    const editedReply = await prisma.reply.update({
      where: {
        id: replyId,
      },
      data: {
        content,
      },
    });
    res.status(200).json(editedReply);
  } catch (error) {
    console.error('Error editing reply:', error);
    res.status(500).json({ error: 'Failed to edit reply' });
  }
});
const deleteReplyToComment = asyncHandler(async (req, res, next) => {
  try {
    const { replyId } = req.body;
    await prisma.reply.delete({
      where: {
        id: replyId,
      },
    });
    res.status(204).send(); // No content to send
  } catch (error) {
    console.error('Error deleting reply:', error);
    res.status(500).json({ error: 'Failed to delete reply' });
  }
});

// @@@@@@@@@@@ get reply and comment
const getReplyToComment = asyncHandler(async (req, res, next) => {
  try {
    const { commentId } = req.params; // Assuming commentId is passed as a URL parameter
    const { page = 1, perPage = 10 } = req.query;

    const skip = (page - 1) * perPage;

    const repliesToComment = await prisma.reply.findMany({
      where: {
        parent_id: null, // Fetch only replies to comments
        comment_id: commentId,
      },
      include: {
        user: true, // Include user who made the reply
      },
      skip: parseInt(skip, 10),
      take: parseInt(perPage, 10),
    });

    res.status(200).json({ repliesToComment });
  } catch (error) {
    console.error('Error fetching replies to comment:', error);
    res.status(500).json({ error: 'Failed to fetch replies to comment' });
  }
});
const getReplyToReply = asyncHandler(async (req, res, next) => {
  try {
    const { replyId } = req.params; // Assuming replyId is passed as a URL parameter
    const { page = 1, perPage = 10 } = req.query;

    const skip = (page - 1) * perPage;

    const repliesToReply = await prisma.reply.findMany({
      where: {
        parent_id: replyId, // Fetch only replies to replies
      },
      include: {
        user: true, // Include user who made the reply
      },
      skip: parseInt(skip, 10),
      take: parseInt(perPage, 10),
    });

    res.status(200).json({ repliesToReply });
  } catch (error) {
    console.error('Error fetching replies to reply:', error);
    res.status(500).json({ error: 'Failed to fetch replies to reply' });
  }
});

const createCompleteProfile = asyncHandler(async (req, res, next) => {
    try {
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

        res.status(201).json({ success: true, data: userProfile });
      } catch (error) {
        console.error('Error creating complete user profile:', error);
        res.status(500).json({ success: false, error: 'Could not create complete user profile' });
      }
});

const getCompleteProfile = asyncHandler(async (req, res, next) => {
    const { userId } = req.params;
    const userProfile = await prisma.profile.findUnique({
        where: { userId },
        include: {
          education: true,
          experience: true,
          certifications: true,
        },
    });
    if (!userProfile) {
        throw new ApiError(404, 'userProfile not found');
    }

    return res
    .status(200)
    .json(
    new ApiResponse(200, userProfile, 'User profile create successfully'),
    );
});

const updateCompleteProfile = asyncHandler(async (req, res, next) => {
    try {
        const { userId } = req.params;
        const {
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

        const userProfile = await prisma.profile.update({
          where: { userId },
          data: {
            firstName,
            lastName,
            middleName,
            email,
            phoneNumber,
            summary,
            education: {
              deleteMany: {},
              createMany: { data: education },
            },
            skills,
            experience: {
              deleteMany: {},
              createMany: { data: experience },
            },
            certifications: {
              deleteMany: {},
              createMany: { data: certifications },
            },
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
        new ApiResponse(200, userProfile, 'User profile updated successfully'),
        );
      } catch (error) {
        console.error('Error updating complete user profile:', error);
        throw new ApiError(404, 'userProfile not found');
      }
});

const deleteCompleteProfile = asyncHandler(async (req, res, next) => {
    try {
        const { userId } = req.params;

        await prisma.profile.delete({
          where: { userId },
        });

        res.json({ success: true, message: 'Complete user profile deleted successfully' });
      } catch (error) {
        console.error('Error deleting complete user profile:', error);
        res.status(500).json({ success: false, error: 'Could not delete complete user profile' });
      }
});

const createFeedForUser = asyncHandler(async (req, res, next) => {
  try {
    const { userId, page = 1, limit = 10 } = req.query;

    // Fetch IDs of users followed by the current user (friends)
    const followedUsers = await prisma.subscription.findMany({
      where: {
        subscriberId: userId,
      },
      select: {
        channelId: true,
      },
    });
    const followedUserIds = followedUsers.map((user) => user.channelId);

    // Fetch IDs of users who follow the current user (followers)
    const followers = await prisma.subscription.findMany({
      where: {
        channelId: userId,
      },
      select: {
        subscriberId: true,
      },
    });
    const followerIds = followers.map((follower) => follower.subscriberId);

    // Fetch IDs of posts in which the user has commented
    const userCommentedPostIds = await prisma.comment.findMany({
      where: {
        userId,
      },
      distinct: ['postId'],
      select: {
        postId: true,
      },
    });

    // Combine all user IDs (friends, followers, and current user)
    const allUserIds = followedUserIds.concat(followerIds, userId);

    // Fetch posts from all users (friends, followers, and current user)
    const posts = await prisma.post.findMany({
      where: {
        OR: [
          { userId: { in: allUserIds } },
          { id: { in: userCommentedPostIds.map((post) => post.postId) } },
        ],
      },
      include: {
        user: true, // Include user who made the post
        likedBy: true, // Include users who liked the post
        comments: { // Include comments on the post
          include: {
            user: true, // Include user who made the comment
            replies: { // Include replies to the comment
              include: {
                user: true, // Include user who made the reply
                parent_reply: { // Include parent reply
                  include: {
                    user: true, // Include user who made the parent reply
                  },
                },
                child_replies: true, // Include child replies
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: parseInt(limit, 10),
      skip: (parseInt(page, 10) - 1) * parseInt(limit, 10),
    });

    // Create or update UserFeedPost records for each fetched post
    await Promise.all(posts.map(async (post) => {
      const existingUserFeedPost = await prisma.userFeedPost.findFirst({
        where: {
          userId,
          postId: post.id,
        },
      });

      if (!existingUserFeedPost) {
        // If the user feed post doesn't exist, create it
        await prisma.userFeedPost.create({
          data: {
            user: {
              connect: { id: userId },
            },
            post: {
              connect: { id: post.id },
            },
            viewed: false,
          },
        });
      } else {
        // If the user feed post already exists, update its viewed status
        await prisma.userFeedPost.update({
          where: {
            id: existingUserFeedPost.id,
          },
          data: {
            viewed: true,
          },
        });
      }
    }));

    // Fetch user feed posts for the current user
    const userFeedPosts = await prisma.userFeedPost.findMany({
      where: {
        userId,
        OR: [
          { viewed: false },
          { postId: { in: posts.map((post) => post.id) } },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: parseInt(limit, 10),
      skip: (parseInt(page, 10) - 1) * parseInt(limit, 10),
    });

    res.status(200).json({
      success: true,
      data: userFeedPosts,
    });
  } catch (error) {
    console.error('Error creating feed for user:', error);
    res.status(500).json({ error: 'Failed to create feed for user' });
  }
});

module.exports = {
  getReplyToReply,
  getReplyToComment,
  deleteReplyToComment,
  editReplyToComment,
  addReplyToComment,
  editCommentToPost,
  deleteCommentToPost,
  addCommentToPost,
  toggleLikePost,
  editPost,
  createPost,
    createFeedForUser,
    createCompleteProfile,
    getCompleteProfile,
    updateCompleteProfile,
    deleteCompleteProfile,
  };
