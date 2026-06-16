const router = require("express").Router();
const authMiddleware = require("../middleware/auth.middleware");
const { body, validationResult } = require("express-validator");
const pageController = require("../controller/page.controller");

const createPageValidation = [
    body("title").notEmpty().withMessage("Title is required"),
    body("workspace").notEmpty().withMessage("Workspace is required"),
    body("content").optional().isString().withMessage("Content must be a string"),
    body("isArchived").optional().isBoolean().withMessage("isArchived must be a boolean")
];

router.post(
    "/",
    authMiddleware,
    createPageValidation,
    pageController.createPage
);

router.post(
    "/create",
    authMiddleware,
    createPageValidation,
    pageController.createPage
);


router.get("/:pageId", authMiddleware, pageController.getPageById);

router.put(
    "/:pageId",
    authMiddleware,
    [
        body("title").optional().notEmpty().withMessage("Title cannot be empty"),
        body("workspace").optional().notEmpty().withMessage("Workspace cannot be empty"),
        body("content").optional().isString().withMessage("Content must be a string")
    ],
    pageController.updatePage
);

router.delete("/:pageId", authMiddleware, pageController.deletePage);

router.post("/:pageId/archive", authMiddleware, pageController.archivePage);

router.post("/:pageId/unarchive", authMiddleware, pageController.unarchivePage);

router.post("/archive/:pageId", authMiddleware, pageController.archivePage);

router.post("/unarchive/:pageId", authMiddleware, pageController.unarchivePage);

module.exports = router;
