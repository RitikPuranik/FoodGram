const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/user.model');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function generateUsername(fullName) {
    if (!fullName) return 'user_' + Math.floor(Math.random() * 1000000);
    const base = fullName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const randomSuffix = Math.floor(Math.random() * 10000);
    return `${base}_${randomSuffix}`;
}

async function migrate() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB.");

        const users = await User.find({});
        console.log(`Found ${users.length} users. Migrating usernames...`);

        let count = 0;
        for (let user of users) {
            if (!user.username) {
                user.username = generateUsername(user.fullName);
                await user.save();
                count++;
            }
        }
        console.log(`Successfully assigned usernames to ${count} users.`);
    } catch (error) {
        console.error("Migration error:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected.");
    }
}

migrate();
