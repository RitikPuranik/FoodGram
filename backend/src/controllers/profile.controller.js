const userModel = require('../models/user.model');
const foodPartnerModel = require('../models/foodpartner.model');
const storageService = require('../services/storage.service');
const { v4: uuid } = require('uuid');

/**
 * PATCH /api/profile/me
 * Updates profile for either a user or food partner.
 * Supports optional avatar image upload (field name: "avatar").
 * Body fields (all optional): fullName / name, bio
 */
async function updateProfile(req, res) {
    try {
        const isPartner = !!req.foodPartner;
        const model = isPartner ? foodPartnerModel : userModel;
        const currentDoc = isPartner ? req.foodPartner : req.user;

        const updates = {};

        // Text fields
        if (req.body.fullName !== undefined) updates.fullName = req.body.fullName.trim();
        if (req.body.name !== undefined)     updates.name     = req.body.name.trim();
        if (req.body.bio  !== undefined)     updates.bio      = req.body.bio.trim();

        // Avatar upload
        if (req.file) {
            const result = await storageService.uploadFile(req.file.buffer, `avatar-${uuid()}`);
            updates.avatar = result.url;
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }

        const updated = await model.findByIdAndUpdate(
            currentDoc._id,
            { $set: updates },
            { new: true, select: '-password' }
        );

        res.status(200).json({
            message: 'Profile updated successfully',
            profile: updated
        });
    } catch (err) {
        console.error('updateProfile error:', err);
        res.status(500).json({ message: err.message });
    }
}

/**
 * GET /api/profile/me
 * Returns the current logged-in user/partner profile.
 */
async function getMyProfile(req, res) {
    try {
        const isPartner = !!req.foodPartner;
        const model = isPartner ? foodPartnerModel : userModel;
        const id = isPartner ? req.foodPartner._id : req.user._id;

        const profile = await model.findById(id).select('-password');
        if (!profile) return res.status(404).json({ message: 'Profile not found' });

        res.status(200).json({ profile });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

module.exports = { updateProfile, getMyProfile };
