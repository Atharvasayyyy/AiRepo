const router = require("express").Router();
const authMiddleware = require("../middleware/auth.middleware");
const { body } = require('express-validator');
const workspaceController = require("../controller/workspace.controller");


// Create a new workspace
router.post("/create",[
    body("name").notEmpty().withMessage("Workspace name is required"),
    body("description").optional().isString().withMessage("Description must be a string"),
    body("members").optional().isArray().withMessage("Members must be an array of user IDs")
] ,authMiddleware,workspaceController.createWorkspace);


router.get("/dashboard", authMiddleware, workspaceController.getDashboard);

router.get("/:workspaceId", authMiddleware, workspaceController.getWorkspaceById);

router.delete("/:workspaceId", authMiddleware, workspaceController.deleteWorkspace);

module.exports = router;