const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const FoodPartner = require('../models/foodpartner.model');
const Food = require('../models/food.model');

const realisticUpdates = [
    {
        oldEmail: "vendor1@example.com",
        name: "Lumina Dining",
        contactName: "Marcus Reynolds",
        email: "marcus@luminadining.com",
        phone: "+1 (555) 234-9812",
        address: "742 Evergreen Terrace, Downtown District",
        bio: "An upscale modern American dining experience highlighting seasonal, locally sourced ingredients and craft cocktails."
    },
    {
        oldEmail: "vendor2@example.com",
        name: "Kaze Sushi",
        contactName: "Ayumi Tanaka",
        email: "ayumi@kazesushi.com",
        phone: "+1 (555) 872-4301",
        address: "419 Sakura Lane, Little Tokyo",
        bio: "Authentic Edo-mae style sushi crafted with fish flown in daily from Toyosu market in Tokyo."
    },
    {
        oldEmail: "vendor3@example.com",
        name: "The Rustic Burger Joint",
        contactName: "Julian Pierce",
        email: "julian@rusticburger.co",
        phone: "+1 (555) 331-0944",
        address: "1105 Oak Street, Westside",
        bio: "Award-winning smash burgers made with a proprietary dry-aged beef blend and homemade brioche buns."
    },
    {
        oldEmail: "vendor4@example.com",
        name: "Trattoria Bella",
        contactName: "Isabella Romano",
        email: "isabella@trattoriabella.com",
        phone: "+1 (555) 448-7719",
        address: "88 Via Roma, Little Italy",
        bio: "Handmade pasta, wood-fired classics, and an extensive wine list inspired by the flavors of Tuscany."
    },
    {
        oldEmail: "vendor5@example.com",
        name: "Taqueria El Sol",
        contactName: "Mateo Garcia",
        email: "mateo@taqueriaelsol.com",
        phone: "+1 (555) 662-8833",
        address: "2442 Mission Blvd, Eastside",
        bio: "Vibrant and authentic street tacos featuring hand-pressed tortillas and slow-roasted meats."
    },
    {
        oldEmail: "vendor6@example.com",
        name: "Verdant Eats",
        contactName: "Chloe Sinclair",
        email: "hello@verdanteats.co",
        phone: "+1 (555) 501-1120",
        address: "900 Healthy Way, The Pearl",
        bio: "Nourishing, plant-based bowls and cold-pressed juices designed to fuel your everyday lifestyle."
    },
    {
        oldEmail: "vendor7@example.com",
        name: "Forno Locale",
        contactName: "Leonardo Rossi",
        email: "leo@fornolocale.com",
        phone: "+1 (555) 773-4598",
        address: "12 Artisan Alley, Historic District",
        bio: "Neapolitan-style pizzas baked at 900 degrees using naturally leavened dough and imported San Marzano tomatoes."
    },
    {
        oldEmail: "vendor8@example.com",
        name: "Crumb & Canvas Bakery",
        contactName: "Sophie Laurent",
        email: "sophie@crumbandcanvas.com",
        phone: "+1 (555) 880-2211",
        address: "45 Baker Street, Uptown",
        bio: "Artisanal sourdough bread, delicate French pastries, and specialty roasted coffee."
    },
    {
        oldEmail: "vendor9@example.com",
        name: "The Golden Wok",
        contactName: "David Chen",
        email: "david@goldenwok.com",
        phone: "+1 (555) 991-3456",
        address: "888 Dragon Avenue, Chinatown",
        bio: "Modern interpretations of classic Sichuan and Cantonese dishes served in a lively, vibrant atmosphere."
    }
];

function getUpdatedDescription(vendorName, isVideo) {
    const intros = [
        "Experience the incredible flavors at",
        "A behind-the-scenes look at the culinary magic from",
        "Fresh out of the kitchen at",
        "A feast for the senses, brought to you by",
        "Elevating everyday dining at"
    ];
    const intro = intros[Math.floor(Math.random() * intros.length)];
    const mediaTypeStr = isVideo ? "Watch the full video to see the magic happen!" : "Drop a comment if you'd love to try this!";
    return `${intro} ${vendorName}. ${mediaTypeStr}`;
}

async function runUpdate() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB.');

        for (const update of realisticUpdates) {
            console.log(`\nUpdating vendor: ${update.oldEmail} -> ${update.email}`);
            
            // Update Vendor
            const vendor = await FoodPartner.findOne({ email: update.oldEmail });
            if (!vendor) {
                console.log(`  Vendor ${update.oldEmail} not found! Skipping.`);
                continue;
            }

            vendor.name = update.name;
            vendor.contactName = update.contactName;
            vendor.email = update.email;
            vendor.phone = update.phone;
            vendor.address = update.address;
            vendor.bio = update.bio;
            await vendor.save();

            // Update Posts
            const posts = await Food.find({ foodPartner: vendor._id });
            console.log(`  Found ${posts.length} posts to update for ${update.name}`);
            
            for (let i = 0; i < posts.length; i++) {
                const post = posts[i];
                post.name = `${update.name} Signature ${i + 1}`;
                post.description = getUpdatedDescription(update.name, post.mediaType === 'video');
                await post.save();
            }
            console.log(`  Successfully updated all details for ${update.name}!`);
        }

        console.log('\n✅ All realistic details updated successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Error updating realistic details:', err);
        process.exit(1);
    }
}

runUpdate();
