const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    video: {
        type: String,
        required: true,
    },
    videoFileId: {
        type: String,
        default: null,   // ImageKit fileId — used for deletion
    },
    mediaType: {
        type: String,
        enum: ['video', 'image'],
        default: 'video'
    },
    description: {
        type: String,
    },
    foodPartner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "foodpartner"
    },
    likeCount: {
        type: Number,
        default: 0
    },
    savesCount: {
        type: Number,
        default: 0
    },
    hashtags: {
        type: [String],
        default: [],
        index: true  // Index for fast hashtag queries
    }
})


const foodModel = mongoose.model("food", foodSchema);


module.exports = foodModel;