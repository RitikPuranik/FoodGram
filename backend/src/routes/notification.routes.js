const express = require("express");
const router = express.Router();
const followController = require("../controllers/follow.controller");
const notificationController = require("../controllers/notification.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// Follow routes (user only)
router.post("/follow", authMiddleware.authUserMiddleware, followController.followVendor);
router.get("/following", authMiddleware.authUserMiddleware, followController.getFollowedVendors);
router.get("/vendors", authMiddleware.authUserMiddleware, followController.getAllVendors);

// Vendor followers (vendor only)
router.get("/followers", authMiddleware.authFoodPartnerMiddleware, followController.getVendorFollowers);

// Notification routes
router.get("/user", authMiddleware.authUserMiddleware, notificationController.getUserNotifications);
router.get("/vendor", authMiddleware.authFoodPartnerMiddleware, notificationController.getVendorNotifications);
router.post("/read", authMiddleware.authUserMiddleware, notificationController.markAsRead);

module.exports = router;
