const mongoose = require('mongoose');


const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
    },
    avatar: {
        type: String,
        default: null
    },
    avatarFileId: {
        type: String,
        default: null   // ImageKit fileId for avatar deletion
    },
    bio: {
        type: String,
        default: ''
    },
    username: {
        type: String,
        unique: true,
        sparse: true
    }
},
    {
        timestamps: true
    }
)

const userModel = mongoose.model("user", userSchema);

module.exports = userModel;