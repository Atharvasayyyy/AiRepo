const router = require("express").Router();
const authMiddleware = require("../middleware/auth.middleware");
const { body } = require('express-validator');
const workspaceController = require("../controller/workspace.controller");
const inviteController = require("../controller/invite.controller");


const workspaceValidation = [
    body("name").notEmpty().withMessage("Workspace name is required"),
    body("description").optional().isString().withMessage("Description must be a string"),
    body("members").optional().isArray().withMessage("Members must be an array of user IDs")
];

// Spec route and legacy route both create a workspace.
router.post("/", workspaceValidation, authMiddleware, workspaceController.createWorkspace);
router.post("/create", workspaceValidation, authMiddleware, workspaceController.createWorkspace);


router.get("/dashboard", authMiddleware, workspaceController.getDashboard);

router.post(
    "/:workspaceId/members",
    authMiddleware,
    [
        body("email").isEmail().withMessage("Valid email is required"),
        body("role").isIn(["admin", "member"]).withMessage("Role must be either admin or member")
    ],
    inviteController.sendInvite
);

router.get("/:workspaceId/members", authMiddleware, inviteController.getInvites);

router.put(
    "/:workspaceId/members/:userId",
    authMiddleware,
    [
        body("role").isIn(["admin", "member"]).withMessage("Role must be either admin or member")
    ],
    inviteController.updateInvite
);

router.delete("/:workspaceId/members/:userId", authMiddleware, inviteController.deleteInvite);

router.get("/:workspaceId", authMiddleware, workspaceController.getWorkspaceById);

router.put(
    "/:workspaceId",
    [
        body("name").optional().notEmpty().withMessage("Workspace name cannot be empty"),
        body("description").optional().isString().withMessage("Description must be a string")
    ],
    authMiddleware,
    workspaceController.updateWorkspace
);

router.delete("/:workspaceId", authMiddleware, workspaceController.deleteWorkspace);

module.exports = router;
