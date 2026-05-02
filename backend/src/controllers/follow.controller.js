const followModel = require("../models/follow.model");
const notificationModel = require("../models/notification.model");
const foodPartnerModel = require("../models/foodpartner.model");

async function followVendor(req, res) {
    try {
        const userId = req.user._id;
        const { vendorId } = req.body;

        if (!vendorId) {
            return res.status(400).json({ message: "vendorId is required" });
        }

        const vendor = await foodPartnerModel.findById(vendorId);
        if (!vendor) {
            return res.status(404).json({ message: "Vendor not found" });
        }

        const existing = await followModel.findOne({ follower: userId, following: vendorId });

        if (existing) {
            await followModel.deleteOne({ _id: existing._id });
            // Remove follow notification
            await notificationModel.deleteOne({
                sender: userId, senderModel: "user",
                recipient: vendorId, recipientModel: "foodpartner",
                type: "follow"
            });
            return res.status(200).json({ message: "Unfollowed successfully", followed: false });
        }

        await followModel.create({ follower: userId, following: vendorId });

        // Create notification for vendor
        await notificationModel.create({
            recipient: vendorId,
            recipientModel: "foodpartner",
            sender: userId,
            senderModel: "user",
            type: "follow",
            message: `${req.user.fullName} started following you`
        });

        res.status(201).json({ message: "Followed successfully", followed: true });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function getFollowedVendors(req, res) {
    try {
        const userId = req.user._id;
        const follows = await followModel.find({ follower: userId }).populate("following", "name contactName email avatar");
        res.status(200).json({
            message: "Followed vendors fetched",
            vendors: follows.map(f => f.following)
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function getAllVendors(req, res) {
    try {
        const userId = req.user._id;
        const vendors = await foodPartnerModel.find({}).select("name contactName email avatar");
        const follows = await followModel.find({ follower: userId });
        const followedIds = new Set(follows.map(f => f.following.toString()));

        // Count followers for each vendor
        const vendorsWithFollow = await Promise.all(vendors.map(async (v) => {
            const followerCount = await followModel.countDocuments({ following: v._id });
            return {
                _id: v._id,
                name: v.name,
                contactName: v.contactName,
                email: v.email,
                avatar: v.avatar,
                followerCount,
                isFollowed: followedIds.has(v._id.toString())
            };
        }));

        res.status(200).json({
            message: "All vendors fetched",
            vendors: vendorsWithFollow
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function getVendorFollowers(req, res) {
    try {
        const vendorId = req.foodPartner._id;
        const count = await followModel.countDocuments({ following: vendorId });
        const followers = await followModel.find({ following: vendorId }).populate("follower", "fullName email");
        res.status(200).json({
            message: "Followers fetched",
            followerCount: count,
            followers: followers.map(f => f.follower)
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

module.exports = {
    followVendor,
    getFollowedVendors,
    getAllVendors,
    getVendorFollowers
};
