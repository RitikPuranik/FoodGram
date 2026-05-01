const express = require('express');
const foodController = require("../controllers/food.controller")
const authMiddleware = require("../middlewares/auth.middleware")
const router = express.Router();
const multer = require('multer');


const upload = multer({
    storage: multer.memoryStorage(),
})


/* POST /api/food/ [protected]*/
router.post('/',
    authMiddleware.authFoodPartnerMiddleware,
    upload.single("mama"),
    foodController.createFood
)


/* GET /api/food/ [protected] */
router.get("/",
    authMiddleware.authUserMiddleware,
    foodController.getFoodItems
)

/* GET /api/food/search?q=pizza [protected] — fuzzy hashtag search */
router.get("/search",
    authMiddleware.authUserMiddleware,
    foodController.searchByHashtag
)

router.post('/like',
    authMiddleware.authUserMiddleware,
    foodController.likeFood
)

router.post('/save',
    authMiddleware.authUserMiddleware,
    foodController.saveFood
)

router.get('/save',
    authMiddleware.authUserMiddleware,
    foodController.getSaveFood
)

router.post("/comment",
    authMiddleware.authUserMiddleware,
    foodController.addComment
);

router.get("/:foodId/comments",
    authMiddleware.authUserMiddleware,
    foodController.getComments
);

router.delete("/comment/:commentId",
    authMiddleware.authUserMiddleware,
    foodController.deleteComment
);

router.post("/comment/:parentCommentId/reply",
    authMiddleware.authUserMiddleware,
    foodController.replyToComment
);


module.exports = router