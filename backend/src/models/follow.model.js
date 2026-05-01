const mongoose = require("mongoose");

const followSchema = new mongoose.Schema({
    follower: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    following: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "foodpartner",
        required: true
    }
}, {
    timestamps: true
});

followSchema.index({ follower: 1, following: 1 }, { unique: true });

const followModel = mongoose.model("follow", followSchema);

module.exports = followModel;
