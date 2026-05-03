const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const FoodPartner = require('../models/foodpartner.model');
const Food = require('../models/food.model');
const { uploadFile } = require('../services/storage.service');

const PROFILE_DIR = 'd:\\Food App\\profile';
const IMAGES_DIR = 'd:\\Food App\\images';
const VIDEOS_DIR = 'd:\\Food App\\videos';

const restaurants = [
    { name: "The Gourmet Kitchen", contactName: "Alice Chef", bio: "Serving the best gourmet dishes in town. Fresh ingredients, exquisite taste." },
    { name: "Sushi Master", contactName: "Kenji Moto", bio: "Authentic Japanese sushi and sashimi made with the freshest catch of the day." },
    { name: "Burger & Co.", contactName: "Bob Grill", bio: "Juicy, mouth-watering burgers loaded with flavor. Your ultimate comfort food!" },
    { name: "Pasta Paradise", contactName: "Luigi Romano", bio: "Traditional Italian pasta recipes handed down through generations." },
    { name: "Taco Fiesta", contactName: "Carlos Mendez", bio: "Spicy, vibrant, and authentic Mexican tacos and burritos." },
    { name: "Green Bowl Salad", contactName: "Emma Greens", bio: "Healthy, fresh, and delicious salads for a guilt-free meal." },
    { name: "Firehouse Pizza", contactName: "Tony Slice", bio: "Wood-fired pizzas with a perfect crust and premium toppings." },
    { name: "Sweet Treats Bakery", contactName: "Sarah Muffin", bio: "Decadent desserts, fresh pastries, and artisanal coffee." },
    { name: "Wok This Way", contactName: "David Chen", bio: "Delicious and savory Asian fusion stir-fries and noodles." }
];

const hashtags = [
    "#Foodie", "#Delicious", "#Yummy", "#InstaFood", "#FoodPorn", 
    "#HealthyEats", "#ComfortFood", "#ChefSpecial", "#Tasty", "#Gourmet"
];

function getRandomHashtags(count) {
    const shuffled = [...hashtags].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

function getRandomDescription(vendorName, isVideo) {
    const intros = [
        "Check out this amazing dish from",
        "You won't believe how good this looks! Courtesy of",
        "Fresh out of the kitchen at",
        "A feast for the eyes and the stomach by",
        "Craving something delicious? Head over to"
    ];
    const intro = intros[Math.floor(Math.random() * intros.length)];
    const mediaTypeStr = isVideo ? "Watch the full video to see the magic!" : "Double tap if you'd eat this right now!";
    return `${intro} ${vendorName}. ${mediaTypeStr}`;
}

async function runSeed() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB.');

        const profileFiles = fs.readdirSync(PROFILE_DIR).filter(f => f.match(/\.(jpg|jpeg|png)$/i));
        const imageFiles = fs.readdirSync(IMAGES_DIR).filter(f => f.match(/\.(jpg|jpeg|png)$/i));
        const videoFiles = fs.readdirSync(VIDEOS_DIR).filter(f => f.match(/\.(mp4|mov|avi)$/i));

        if (profileFiles.length < 9) throw new Error("Need at least 9 profile pictures!");
        if (imageFiles.length < 36) throw new Error("Need at least 36 images!");
        if (videoFiles.length < 36) throw new Error("Need at least 36 videos!");

        let imageIndex = 0;
        let videoIndex = 0;

        for (let i = 0; i < 9; i++) {
            const rInfo = restaurants[i];
            console.log(`\n--- Seeding Vendor ${i + 1}/9: ${rInfo.name} ---`);
            
            // 1. Upload Profile Picture
            const profilePath = path.join(PROFILE_DIR, profileFiles[i]);
            console.log(`Uploading avatar: ${profileFiles[i]}`);
            const profileBuffer = fs.readFileSync(profilePath);
            const avatarUpload = await uploadFile(profileBuffer, profileFiles[i]);

            // 2. Create Vendor
            const hashedPassword = await bcrypt.hash('password123', 10);
            const email = `vendor${i + 1}@example.com`;
            const newVendor = new FoodPartner({
                name: rInfo.name,
                contactName: rInfo.contactName,
                phone: `555-010${i}`,
                address: `123 Food Street, Suite ${i + 1}`,
                email: email,
                password: hashedPassword,
                avatar: avatarUpload.url,
                avatarFileId: avatarUpload.fileId,
                bio: rInfo.bio
            });
            await newVendor.save();
            console.log(`Created vendor: ${rInfo.name} (${email})`);

            // 3. Upload 4 Image Posts
            for (let j = 0; j < 4; j++) {
                const imgName = imageFiles[imageIndex];
                const imgPath = path.join(IMAGES_DIR, imgName);
                console.log(`  Uploading image post ${j + 1}/4: ${imgName}`);
                const imgBuffer = fs.readFileSync(imgPath);
                const imgUpload = await uploadFile(imgBuffer, imgName);

                const newImagePost = new Food({
                    name: `${rInfo.name} Special ${j + 1}`,
                    video: imgUpload.url, // Reusing 'video' field for media url
                    videoFileId: imgUpload.fileId,
                    mediaType: 'image',
                    description: getRandomDescription(rInfo.name, false),
                    foodPartner: newVendor._id,
                    hashtags: getRandomHashtags(3)
                });
                await newImagePost.save();
                imageIndex++;
            }

            // 4. Upload 4 Video Posts
            for (let k = 0; k < 4; k++) {
                const vidName = videoFiles[videoIndex];
                const vidPath = path.join(VIDEOS_DIR, vidName);
                console.log(`  Uploading video post ${k + 1}/4: ${vidName}`);
                const vidBuffer = fs.readFileSync(vidPath);
                const vidUpload = await uploadFile(vidBuffer, vidName);

                const newVideoPost = new Food({
                    name: `${rInfo.name} Highlight ${k + 1}`,
                    video: vidUpload.url,
                    videoFileId: vidUpload.fileId,
                    mediaType: 'video',
                    description: getRandomDescription(rInfo.name, true),
                    foodPartner: newVendor._id,
                    hashtags: getRandomHashtags(3)
                });
                await newVideoPost.save();
                videoIndex++;
            }
        }

        console.log('\n✅ Seeding complete!');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding data:', err);
        process.exit(1);
    }
}

runSeed();
