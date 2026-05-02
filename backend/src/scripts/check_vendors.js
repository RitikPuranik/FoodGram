const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const FoodPartner = require('../models/foodpartner.model');
const Food = require('../models/food.model');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const vendors = await FoodPartner.find({});
        for (let v of vendors) {
            const count = await Food.countDocuments({ foodPartner: v._id });
            const nullCount = await Food.countDocuments({ foodPartner: null });
            const undefinedCount = await Food.countDocuments({ foodPartner: { $exists: false } });
            console.log(`Vendor ${v.name} (${v._id}) has ${count} posts`);
            if (count > 0) {
               const posts = await Food.find({ foodPartner: v._id }).limit(1);
               console.log('   Sample post name:', posts[0].name);
            }
        }
        
        const allPosts = await Food.find({});
        console.log(`Total posts in DB: ${allPosts.length}`);
        
        const nullCount = await Food.countDocuments({ foodPartner: null });
        console.log(`Posts with null foodPartner: ${nullCount}`);

        const undefinedCount = await Food.countDocuments({ foodPartner: { $exists: false } });
        console.log(`Posts with no foodPartner field: ${undefinedCount}`);

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

check();
