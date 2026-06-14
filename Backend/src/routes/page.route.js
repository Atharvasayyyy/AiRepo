const router = require("express").Router();
const authMiddleware = require("../middleware/auth.middleware");
const { body, validationResult } = require("express-validator");
const pageController = require("../controller/page.controller");

router.post(
    "/create",
    authMiddleware,
    [
        body("title").notEmpty().withMessage("Title is required"),
        body("workspace").notEmpty().withMessage("Workspace is required"),
        body("content").optional(),
        body("isArchived").optional().isBoolean().withMessage("isArchived must be a boolean")
    ],
    pageController.createPage
);


router.get("/:pageId", authMiddleware, pageController.getPageById);

router.put(
    "/:pageId",
    authMiddleware,
    [
        body("title").notEmpty().withMessage("Title is required"),
        body("workspace").notEmpty().withMessage("Workspace is required"),
        body("content").optional(),
        body("isArchived").optional().isBoolean().withMessage("isArchived must be a boolean")
    ],
    pageController.updatePage
);

router.delete("/:pageId", authMiddleware, pageController.deletePage);

router.post("/:pageId/archive", authMiddleware, pageController.archivePage);

router.post("/:pageId/unarchive", authMiddleware, pageController.unarchivePage);

module.exports = router;
