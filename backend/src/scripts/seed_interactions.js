const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const User = require('../models/user.model');
const Food = require('../models/food.model');
const Like = require('../models/likes.model');
const Save = require('../models/save.model');
const Comment = require('../models/comment.model');

// Random helper functions
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffle = (array) => array.sort(() => 0.5 - Math.random());

const firstNames = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Nancy", "Daniel", "Lisa", "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra"];
const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson"];

const commentTexts = [
    "This looks absolutely delicious!",
    "Wow, I need to try this ASAP.",
    "Can't wait to visit!",
    "Amazing presentation.",
    "My mouth is watering just looking at this.",
    "This is exactly what I've been craving.",
    "Looks so fresh and healthy!",
    "Perfection on a plate.",
    "The flavors must be incredible.",
    "Adding this to my must-try list.",
    "Stunning!",
    "Looks super tasty.",
    "I'm definitely ordering this next time.",
    "10/10 would devour.",
    "This place never disappoints."
];

const replyTexts = [
    "I totally agree!",
    "Right? It looks so good.",
    "I had it last week and it was amazing.",
    "You have to try it, highly recommend.",
    "Same here!",
    "Haha true."
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB.");

        // 1. Create 30 Users
        console.log("Creating 30 users...");
        const users = [];
        const hashedPassword = await bcrypt.hash('password123', 10);
        
        for (let i = 0; i < 30; i++) {
            const firstName = firstNames[i % firstNames.length];
            const lastName = lastNames[i % lastNames.length];
            const email = `user${i}_${Date.now()}@example.com`;
            
            const user = new User({
                fullName: `${firstName} ${lastName}`,
                email: email,
                password: hashedPassword,
                bio: `Food lover from the city. Always hungry.`
            });
            await user.save();
            users.push(user);
        }
        console.log(`Created ${users.length} users.`);

        // 2. Fetch all foods
        const foods = await Food.find({});
        console.log(`Found ${foods.length} foods to seed interactions for.`);

        for (let food of foods) {
            console.log(`\nSeeding interactions for food: ${food.name}`);
            const shuffledUsers = shuffle([...users]);

            // LIKES (between 21 and 28 likes per post)
            const numLikes = randomInt(21, 28);
            const likers = shuffledUsers.slice(0, numLikes);
            for (let liker of likers) {
                // check if like exists
                const existingLike = await Like.findOne({ user: liker._id, food: food._id });
                if(!existingLike) {
                    await Like.create({ user: liker._id, food: food._id });
                }
            }
            food.likeCount = await Like.countDocuments({ food: food._id });
            console.log(`  Added ${numLikes} likes.`);

            // SAVES (between 5 and 15 saves per post)
            const numSaves = randomInt(5, 15);
            // Re-shuffle for saves so it's not always the same people
            const savers = shuffle([...users]).slice(0, numSaves);
            for (let saver of savers) {
                const existingSave = await Save.findOne({ user: saver._id, food: food._id });
                if(!existingSave) {
                    await Save.create({ user: saver._id, food: food._id });
                }
            }
            food.savesCount = await Save.countDocuments({ food: food._id });
            console.log(`  Added ${numSaves} saves.`);

            // COMMENTS (between 3 and 8 top-level comments)
            const numComments = randomInt(3, 8);
            const commenters = shuffle([...users]).slice(0, numComments);
            const createdComments = [];
            
            for (let commenter of commenters) {
                const commentText = commentTexts[randomInt(0, commentTexts.length - 1)];
                const newComment = await Comment.create({
                    user: commenter._id,
                    food: food._id,
                    comment: commentText
                });
                createdComments.push(newComment);
            }
            console.log(`  Added ${numComments} top-level comments.`);

            // REPLIES (randomly reply to 1-4 of the created comments)
            if (createdComments.length > 0) {
                const numReplies = randomInt(1, 4);
                for (let i = 0; i < numReplies; i++) {
                    const parentComment = createdComments[randomInt(0, createdComments.length - 1)];
                    const replier = users[randomInt(0, users.length - 1)]; // anyone can reply
                    const replyText = replyTexts[randomInt(0, replyTexts.length - 1)];
                    
                    await Comment.create({
                        user: replier._id,
                        food: food._id,
                        comment: replyText,
                        parentComment: parentComment._id
                    });
                }
                console.log(`  Added ${numReplies} replies to comments.`);
            }

            // Save the updated food counts
            await food.save();
        }

        console.log("\nSeeding complete!");

    } catch (error) {
        console.error("Error during seeding:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB.");
    }
}

seed();
