const foodModel = require('../models/food.model');
const storageService = require('../services/storage.service');
const likeModel = require("../models/likes.model");
const saveModel = require("../models/save.model");
const commentModel = require("../models/comment.model");
const notificationModel = require("../models/notification.model");
const followModel = require("../models/follow.model");
const { v4: uuid } = require("uuid");
const { get } = require('mongoose');

async function deleteCommentRecursive(commentId) {
    const replies = await commentModel.find({ parentComment: commentId });

    for (let reply of replies) {
        await deleteCommentRecursive(reply._id);
    }

    await commentModel.findByIdAndDelete(commentId);
}

async function createFood(req, res) {
    const fileUploadResult = await storageService.uploadFile(req.file.buffer, uuid())

    // Parse and normalize hashtags: strip #, lowercase, remove duplicates
    let hashtags = [];
    if (req.body.hashtags) {
        const raw = Array.isArray(req.body.hashtags)
            ? req.body.hashtags
            : String(req.body.hashtags).split(',');
        hashtags = [...new Set(
            raw
                .map(t => t.trim().replace(/^#+/, '').toLowerCase())
                .filter(t => t.length > 0)
        )];
    }

    let mediaType = 'video';
    if (req.file.mimetype.startsWith('image/')) {
        mediaType = 'image';
    }

    const foodItem = await foodModel.create({
        name: req.body.name,
        description: req.body.description,
        video: fileUploadResult.url,
        videoFileId: fileUploadResult.fileId || null,
        mediaType,
        foodPartner: req.foodPartner._id,
        hashtags
    })

    // Notify all followers that this vendor posted new content
    try {
        const followers = await followModel.find({ following: req.foodPartner._id });
        const notifications = followers.map(f => ({
            recipient: f.follower,
            recipientModel: "user",
            sender: req.foodPartner._id,
            senderModel: "foodpartner",
            type: "new_post",
            food: foodItem._id,
            message: `${req.foodPartner.name} posted a new food video`
        }));
        if (notifications.length > 0) {
            await notificationModel.insertMany(notifications);
        }
    } catch (e) {
        console.error("Notification error:", e.message);
    }

    res.status(201).json({
        message: "food created successfully",
        food: foodItem
    })

}

async function getFoodItems(req, res) {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const followingOnly = req.query.followingOnly === 'true';
    const excludeFollowed = req.query.excludeFollowed === 'true';
    const sortMode = req.query.sort === 'latest' ? 'latest' : 'default';

    let followedVendorIds = [];
    if (req.user) {
        const follows = await followModel.find({ follower: req.user._id });
        followedVendorIds = follows.map(f => f.following);
    }

    const matchStage = {};
    if (req.query.type) {
        matchStage.mediaType = req.query.type;
    }
    if (followingOnly) {
        matchStage.foodPartner = { $in: followedVendorIds };
    } else if (excludeFollowed) {
        matchStage.foodPartner = { $nin: followedVendorIds };
    }

    const totalCount = await foodModel.countDocuments(matchStage);
    const sortStage = followingOnly || sortMode === 'latest'
        ? { createdAt: -1 }
        : { isFollowed: -1, createdAt: -1 };

    const aggregation = [
        { $match: matchStage }
    ];

    if (followingOnly) {
        aggregation.push({
            $addFields: {
                isFollowed: 1
            }
        });
    } else {
        aggregation.push({
            $addFields: {
                isFollowed: {
                    $cond: {
                        if: { $in: ["$foodPartner", followedVendorIds] },
                        then: 1,
                        else: 0
                    }
                }
            }
        });
    }

    aggregation.push(
        { $sort: sortStage },
        { $skip: skip },
        { $limit: limit },
        {
            $lookup: {
                from: 'foodpartners',
                localField: 'foodPartner',
                foreignField: '_id',
                as: 'foodPartner'
            }
        },
        { $unwind: { path: '$foodPartner', preserveNullAndEmptyArrays: true } },
        {
            $project: {
                name: 1,
                video: 1,
                videoFileId: 1,
                description: 1,
                likeCount: 1,
                savesCount: 1,
                views: 1,
                hashtags: 1,
                createdAt: 1,
                isFollowed: 1,
                foodPartner: {
                    _id: 1,
                    name: 1,
                    avatar: 1
                }
            }
        }
    );

    const foodItems = await foodModel.aggregate(aggregation);

    res.status(200).json({
        message: "Food items fetched successfully",
        foodItems,
        page,
        hasMore: skip + foodItems.length < totalCount,
        totalCount,
        followingCount: followedVendorIds.length
    })
}

/**
 * GET /api/food/search?q=pizza
 * Fuzzy/partial hashtag search using MongoDB regex.
 * e.g. "pizza" will match posts with hashtags like "pizza", "pizzas", "spicypizza".
 */
async function searchByHashtag(req, res) {
    try {
        const rawQuery = (req.query.q || '').trim().replace(/^#+/, '').toLowerCase();
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        if (!rawQuery) {
            // No query — return all foods with pagination
            const foodItems = await foodModel.find({})
                .populate('foodPartner', 'name avatar')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);
            
            return res.status(200).json({ 
                message: 'All food items', 
                foodItems,
                page,
                hasMore: foodItems.length === limit
            });
        }

        // Partial, case-insensitive regex match against hashtags array
        const regex = new RegExp(rawQuery, 'i');
        const foodItems = await foodModel.find({ hashtags: { $elemMatch: { $regex: regex } } })
            .populate('foodPartner', 'name avatar')
            .sort({ likeCount: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            message: `Search results for "${rawQuery}"`,
            foodItems,
            page,
            hasMore: foodItems.length === limit
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function likeFood(req, res) {
    const { foodId } = req.body;
    const user = req.user;

    if (!user) {
        return res.status(403).json({ message: "Only regular users can like posts." });
    }

    const isAlreadyLiked = await likeModel.findOne({
        user: user._id,
        food: foodId
    })

    if (isAlreadyLiked) {
        await likeModel.deleteOne({
            user: user._id,
            food: foodId
        })

        await foodModel.findByIdAndUpdate(foodId, {
            $inc: { likeCount: -1 }
        })

        return res.status(200).json({
            message: "Food unliked successfully"
        })
    }

    const like = await likeModel.create({
        user: user._id,
        food: foodId
    })

    await foodModel.findByIdAndUpdate(foodId, {
        $inc: { likeCount: 1 }
    })

    // Notify the vendor
    try {
        const food = await foodModel.findById(foodId);
        if (food && food.foodPartner) {
            await notificationModel.create({
                recipient: food.foodPartner,
                recipientModel: "foodpartner",
                sender: user._id,
                senderModel: "user",
                type: "like",
                food: foodId,
                message: `${user.fullName} liked your post "${food.name}"`
            });
        }
    } catch (e) {
        console.error("Notification error:", e.message);
    }

    res.status(201).json({
        message: "Food liked successfully",
        like
    })

}

async function saveFood(req, res) {

    const { foodId } = req.body;
    const user = req.user;

    if (!user) {
        return res.status(403).json({ message: "Only regular users can save posts." });
    }

    const isAlreadySaved = await saveModel.findOne({
        user: user._id,
        food: foodId
    })

    if (isAlreadySaved) {
        await saveModel.deleteOne({
            user: user._id,
            food: foodId
        })

        await foodModel.findByIdAndUpdate(foodId, {
            $inc: { savesCount: -1 }
        })

        return res.status(200).json({
            message: "Food unsaved successfully"
        })
    }

    const save = await saveModel.create({
        user: user._id,
        food: foodId
    })

    await foodModel.findByIdAndUpdate(foodId, {
        $inc: { savesCount: 1 }
    })

    // Notify the vendor
    try {
        const food = await foodModel.findById(foodId);
        if (food && food.foodPartner) {
            await notificationModel.create({
                recipient: food.foodPartner,
                recipientModel: "foodpartner",
                sender: user._id,
                senderModel: "user",
                type: "save",
                food: foodId,
                message: `${user.fullName} saved your post "${food.name}"`
            });
        }
    } catch (e) {
        console.error("Notification error:", e.message);
    }

    res.status(201).json({
        message: "Food saved successfully",
        save
    })

}

async function getSaveFood(req, res) {

    const user = req.user;
    if (!user) return res.status(403).json({ message: "Only users can access saved posts" });

    const savedFoods = await saveModel.find({ user: user._id }).populate('food');

    if (!savedFoods || savedFoods.length === 0) {
        return res.status(404).json({ message: "No saved foods found" });
    }

    res.status(200).json({
        message: "Saved foods retrieved successfully",
        savedFoods
    });

}

async function addComment(req, res) {
    const { foodId, comment } = req.body;
    const user = req.user;

    if (!user) {
        return res.status(403).json({ message: "Only regular users can add comments." });
    }

    if (!comment || comment.trim() === "") {
        return res.status(400).json({ message: "Comment cannot be empty" });
    }

    const newComment = await commentModel.create({
        food: foodId,
        user: user._id,
        comment
    });

    // Notify the vendor
    try {
        const food = await foodModel.findById(foodId);
        if (food && food.foodPartner) {
            await notificationModel.create({
                recipient: food.foodPartner,
                recipientModel: "foodpartner",
                sender: user._id,
                senderModel: "user",
                type: "comment",
                food: foodId,
                comment: newComment._id,
                message: `${user.fullName} commented on "${food.name}": "${comment.substring(0, 50)}"`
            });
        }
    } catch (e) {
        console.error("Notification error:", e.message);
    }

    res.status(201).json({
        message: "Comment added successfully",
        comment: newComment
    });
}

async function getComments(req, res) {
    try {
        const { foodId } = req.params;

        const allComments = await commentModel
            .find({ food: foodId })
            .populate("user", "fullName email username avatar")
            .sort({ createdAt: 1 })
            .lean();

        const topLevelComments = allComments.filter(c => !c.parentComment);

        const commentTree = topLevelComments.map(top => {
            const replies = [];
            
            function findDescendants(parentId) {
                const children = allComments.filter(c => String(c.parentComment) === String(parentId));
                for (let child of children) {
                    // Attach who they are replying to
                    const parent = allComments.find(p => String(p._id) === String(child.parentComment));
                    if (parent && parent.user) {
                        child.replyToUsername = parent.user.username || parent.user.fullName;
                    }
                    replies.push(child);
                    findDescendants(child._id);
                }
            }
            
            findDescendants(top._id);
            
            // Sort replies by createdAt
            replies.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            
            return {
                ...top,
                replies
            };
        });


        res.status(200).json({
            message: "Comments fetched successfully",
            comments: commentTree
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function deleteComment(req, res) {
    const { commentId } = req.params;
    const user = req.user;

    const comment = await commentModel.findById(commentId);

    if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
    }

    if (comment.user.toString() !== user._id.toString()) {
        return res.status(403).json({ message: "Not authorized to delete this comment" });
    }

    await deleteCommentRecursive(commentId);

    res.status(200).json({
        message: "Comment and all replies deleted successfully"
    });
}

async function replyToComment(req, res) {
    try {
        const { parentCommentId } = req.params;
        const { comment } = req.body;
        
        if (!req.user) {
            return res.status(403).json({ message: "Only regular users can reply to comments." });
        }
        
        const userId = req.user._id;

        const parent = await commentModel.findById(parentCommentId).populate("user", "fullName");
        if (!parent) {
            return res.status(404).json({ message: "Parent comment not found" });
        }

        const reply = await commentModel.create({
            user: userId,
            food: parent.food,  
            comment,
            parentComment: parentCommentId
        });

        // Notify the original commenter that someone replied
        try {
            if (parent.user._id.toString() !== userId.toString()) {
                const food = await foodModel.findById(parent.food);
                await notificationModel.create({
                    recipient: parent.user._id,
                    recipientModel: "user",
                    sender: userId,
                    senderModel: "user",
                    type: "reply",
                    food: parent.food,
                    comment: reply._id,
                    message: `${req.user.fullName} replied to your comment: "${comment.substring(0, 50)}"`
                });
            }
        } catch (e) {
            console.error("Notification error:", e.message);
        }

        // Also notify vendor about the comment
        try {
            const food = await foodModel.findById(parent.food);
            if (food && food.foodPartner) {
                await notificationModel.create({
                    recipient: food.foodPartner,
                    recipientModel: "foodpartner",
                    sender: userId,
                    senderModel: "user",
                    type: "comment",
                    food: parent.food,
                    comment: reply._id,
                    message: `${req.user.fullName} replied to a comment on "${food.name}"`
                });
            }
        } catch (e) {
            console.error("Notification error:", e.message);
        }

        res.status(201).json({
            message: "Reply added successfully",
            reply
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}


async function deleteFood(req, res) {
    const { foodId } = req.params;

    const food = await foodModel.findById(foodId);
    if (!food) {
        return res.status(404).json({ message: "Post not found" });
    }

    // Only the owning food partner can delete their post
    if (food.foodPartner.toString() !== req.foodPartner._id.toString()) {
        return res.status(403).json({ message: "Not authorized to delete this post" });
    }

    // Delete video from ImageKit cloud storage
    if (food.videoFileId) {
        await storageService.deleteFile(food.videoFileId);
    } else if (food.video) {
        // Fallback: look up fileId by URL (for older posts without stored fileId)
        const fileId = await storageService.getFileIdByUrl(food.video);
        if (fileId) await storageService.deleteFile(fileId);
    }

    // Cascade-delete all related data
    const comments = await commentModel.find({ food: foodId });
    for (const c of comments) {
        await deleteCommentRecursive(c._id);
    }
    await likeModel.deleteMany({ food: foodId });
    await saveModel.deleteMany({ food: foodId });
    await notificationModel.deleteMany({ food: foodId });
    await foodModel.findByIdAndDelete(foodId);

    res.status(200).json({ message: "Post deleted successfully" });
}

async function updateFood(req, res) {
    const { foodId } = req.params;

    const food = await foodModel.findById(foodId);
    if (!food) {
        return res.status(404).json({ message: "Post not found" });
    }

    // Only the owning food partner can edit their post
    if (food.foodPartner.toString() !== req.foodPartner._id.toString()) {
        return res.status(403).json({ message: "Not authorized to edit this post" });
    }

    const { name, description, hashtags } = req.body;
    if (name) food.name = name;
    if (description !== undefined) food.description = description;

    if (hashtags) {
        const raw = Array.isArray(hashtags) ? hashtags : String(hashtags).split(',');
        food.hashtags = [...new Set(
            raw.map(t => t.trim().replace(/^#+/, '').toLowerCase()).filter(t => t.length > 0)
        )];
    }

    await food.save();
    res.status(200).json({ message: "Post updated successfully", food });
}

async function incrementViews(req, res) {
    try {
        const { foodId } = req.params;
        await foodModel.findByIdAndUpdate(foodId, { $inc: { views: 1 } });
        res.status(200).json({ message: "View incremented" });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
}

module.exports = {
    createFood,
    getFoodItems,
    searchByHashtag,
    likeFood,
    saveFood,
    getSaveFood,
    addComment,
    getComments,
    deleteComment,
    deleteCommentRecursive,
    replyToComment,
    deleteFood,
    updateFood,
    incrementViews
}
