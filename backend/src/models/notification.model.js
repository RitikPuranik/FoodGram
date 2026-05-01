const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    // Who receives this notification
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: "recipientModel"
    },
    recipientModel: {
        type: String,
        required: true,
        enum: ["user", "foodpartner"]
    },
    // Who triggered it
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: "senderModel"
    },
    senderModel: {
        type: String,
        required: true,
        enum: ["user", "foodpartner"]
    },
    // Type: like, comment, reply, follow, new_post
    type: {
        type: String,
        required: true,
        enum: ["like", "comment", "reply", "follow", "save", "new_post"]
    },
    // Related food post (optional)
    food: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "food",
        default: null
    },
    // Related comment (for reply notifications)
    comment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "comment",
        default: null
    },
    message: {
        type: String,
        default: ""
    },
    read: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

notificationSchema.index({ recipient: 1, recipientModel: 1, createdAt: -1 });

const notificationModel = mongoose.model("notification", notificationSchema);

module.exports = notificationModel;
