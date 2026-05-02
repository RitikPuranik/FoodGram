const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');
const fs = require('fs');
const FoodPartner = require('../models/foodpartner.model');
const Food = require('../models/food.model');
const { deleteFile, uploadFile } = require('../services/storage.service');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const vendor = await FoodPartner.findOne({ name: /Healthy Harvest/i });
        if (!vendor) {
            console.log('Vendor "Healthy Harvest" not found');
            return;
        }
        console.log('Found vendor:', vendor.name, 'ID:', vendor._id);

        const foods = await Food.find({ foodPartner: vendor._id });
        console.log(`Found ${foods.length} posts for this vendor`);

        const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
        
        for (const food of foods) {
            const isImage = imageExtensions.some(ext => food.video.toLowerCase().includes(ext));
            
            if (isImage) {
                console.log(`Deleting image post: ${food.name} (${food.video})`);
                // Delete from cloud
                if (food.videoFileId) {
                    await deleteFile(food.videoFileId);
                }
                // Delete from DB
                await Food.findByIdAndDelete(food._id);
            } else {
                console.log(`Keeping video post: ${food.name} (${food.video})`);
            }
        }

        // Upload new image
        const newImagePath = 'd:\\Food App\\images\\i_3_0.jpg';
        if (fs.existsSync(newImagePath)) {
            console.log('Uploading new image:', newImagePath);
            const fileData = fs.readFileSync(newImagePath);
            const uploadResult = await uploadFile(fileData, 'healthy_harvest_main.jpg');
            
            await Food.create({
                name: 'Fresh Harvest Salad',
                video: uploadResult.url,
                videoFileId: uploadResult.fileId,
                description: 'Our signature fresh harvest salad with seasonal greens and organic vegetables.',
                foodPartner: vendor._id,
                hashtags: ['healthy', 'fresh', 'salad', 'organic']
            });
            console.log('New image post created successfully');
        } else {
            console.log('New image file not found at:', newImagePath);
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from DB');
    }
}

run();
