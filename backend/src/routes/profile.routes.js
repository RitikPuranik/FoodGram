const express = require('express');
const multer = require('multer');
const profileController = require('../controllers/profile.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Middleware that tries user auth first, then partner auth
function authEither(req, res, next) {
    // Try user token first
    authMiddleware.authUserMiddleware(req, res, (userErr) => {
        if (!userErr && req.user) return next();
        // Try food partner token
        authMiddleware.authFoodPartnerMiddleware(req, res, (partnerErr) => {
            if (!partnerErr && req.foodPartner) return next();
            return res.status(401).json({ message: 'Unauthorized' });
        });
    });
}

// GET /api/profile/me
router.get('/me', authEither, profileController.getMyProfile);

// PATCH /api/profile/me  (multipart with optional avatar image)
router.patch('/me', authEither, upload.single('avatar'), profileController.updateProfile);

module.exports = router;
