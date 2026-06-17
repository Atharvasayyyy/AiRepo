const router = require("express").Router();
const authMiddleware = require("../middleware/auth.middleware");
const pageActivityController = require("../controller/pageActivity.controller");

router.get("/favorites", authMiddleware, pageActivityController.getFavorites);
router.get("/recent", authMiddleware, pageActivityController.getRecent);
router.post("/recent/:pageId", authMiddleware, pageActivityController.trackRecent);
router.post("/page/:pageId/favorite", authMiddleware, pageActivityController.addFavorite);
router.delete("/page/:pageId/favorite", authMiddleware, pageActivityController.removeFavorite);
router.post("/page/:pageId/recent", authMiddleware, pageActivityController.trackRecent);

module.exports = router;
