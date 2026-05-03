const notificationModel = require("../models/notification.model");
require("../models/user.model");
require("../models/foodpartner.model");
require("../models/food.model");
require("../models/comment.model");

async function getUserNotifications(req, res) {
    try {
        const userId = req.user._id;
        const notifications = await notificationModel
            .find({ recipient: userId, recipientModel: "user" })
            .populate("sender", "fullName name email avatar")
            .populate("food", "name video")
            .populate("comment", "comment")
            .sort({ createdAt: -1 })
            .limit(50);

        res.status(200).json({ message: "Notifications fetched", notifications });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function getVendorNotifications(req, res) {
    try {
        const vendorId = req.foodPartner._id;
        const notifications = await notificationModel
            .find({ recipient: vendorId, recipientModel: "foodpartner" })
            .populate("sender", "fullName name email avatar")
            .populate("food", "name video")
            .populate("comment", "comment")
            .sort({ createdAt: -1 })
            .limit(50);

        res.status(200).json({ message: "Notifications fetched", notifications });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function markAsRead(req, res) {
    try {
        const { notificationIds } = req.body;
        await notificationModel.updateMany(
            { _id: { $in: notificationIds } },
            { read: true }
        );
        res.status(200).json({ message: "Marked as read" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

module.exports = {
    getUserNotifications,
    getVendorNotifications,
    markAsRead
};
