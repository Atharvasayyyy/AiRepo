const router = require("express").Router();
const { body } = require("express-validator");
const authMiddleware = require("../middleware/auth.middleware");
const aiController = require("../controller/ai.controller");

router.post(
    "/action",
    authMiddleware,
    [
        body("action").isIn(["summarize", "tasks", "decisions", "prd"]).withMessage("Invalid AI action"),
        body("pageContent").optional().isString().withMessage("Page content must be a string"),
        body("chatHistory").optional().isString().withMessage("Chat history must be a string"),
        body("userMessage").optional().isString().withMessage("User message must be a string")
    ],
    aiController.runAction
);

module.exports = router;
