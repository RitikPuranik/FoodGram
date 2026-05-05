const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const User = require('../models/user.model');
const FoodPartner = require('../models/foodpartner.model');
const Follow = require('../models/follow.model');

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffle = (array) => array.sort(() => 0.5 - Math.random());

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB.");

        const users = await User.find({});
        const vendors = await FoodPartner.find({});
        
        console.log(`Found ${users.length} users and ${vendors.length} vendors.`);

        for (let user of users) {
            // Each user follows between 3 and 8 random vendors
            const numFollows = randomInt(3, Math.min(8, vendors.length));
            const vendorsToFollow = shuffle([...vendors]).slice(0, numFollows);
            
            process.stdout.write(`User ${user.fullName} following ${numFollows} vendors...\r`);
            
            for (let vendor of vendorsToFollow) {
                try {
                    // Check if already following to avoid errors
                    const exists = await Follow.findOne({ follower: user._id, following: vendor._id });
                    if (!exists) {
                        await Follow.create({
                            follower: user._id,
                            following: vendor._id
                        });
                    }
                } catch (e) {
                    // Ignore errors
                }
            }
        }

        console.log("\nFollow seeding complete!");

    } catch (error) {
        console.error("\nError during seeding:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB.");
    }
}

seed();
