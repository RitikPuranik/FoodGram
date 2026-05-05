const foodPartnerModel = require('../models/foodpartner.model');
const foodModel = require('../models/food.model');
const followModel = require('../models/follow.model');

async function getFoodPartnerById(req, res) {
  try {
    const foodPartnerId = req.params.id;

    const foodPartner = await foodPartnerModel.findById(foodPartnerId);

    if (!foodPartner) {
      return res.status(404).json({ message: 'Food partner not found' });
    }

    const foodItemsByFoodPartner = await foodModel.find({ foodPartner: foodPartnerId });
    const followersCount = await followModel.countDocuments({ following: foodPartnerId });

    res.status(200).json({
      message: 'Food partner retrieved successfully',
      foodPartner: {
        ...foodPartner.toObject(),
        foodItems: foodItemsByFoodPartner,
        followersCount
      }
    });
  } catch (err) {
    console.error('getFoodPartnerById error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

module.exports = {
  getFoodPartnerById
};