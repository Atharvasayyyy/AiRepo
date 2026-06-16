const router = require("express").Router();
const authMiddleware = require("../middleware/auth.middleware");
const Workspace = require("../model/workspace.model");
const Page = require("../model/pages.model");
const DiscussionMessage = require("../model/dessesion.model");

router.get("/", authMiddleware, async (req, res) => {
    const query = (req.query.q || "").trim();

    if (!query) {
        return res.status(200).json({
            workspaces: [],
            pages: [],
            discussions: [],
            pinnedMessages: [],
            decisions: []
        });
    }

    const filter = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const userId = req.user.id || req.user._id;

    const workspaces = await Workspace.find({
        $and: [
            {
                $or: [
                    { owner: userId },
                    { "members.user": userId }
                ]
            },
            {
                $or: [
                    { name: filter },
                    { description: filter }
                ]
            }
        ]
    }).limit(20);

    const workspaceIds = workspaces.map((workspace) => workspace._id);
    const accessibleWorkspaces = await Workspace.find({
        $or: [
            { owner: userId },
            { "members.user": userId }
        ]
    }).select("_id");
    const accessibleWorkspaceIds = accessibleWorkspaces.map((workspace) => workspace._id);

    const pages = await Page.find({
        workspace: { $in: accessibleWorkspaceIds },
        $or: [
            { title: filter },
            { content: filter }
        ]
    }).limit(20);

    const discussions = await DiscussionMessage.find({
        workspace: { $in: accessibleWorkspaceIds },
        content: filter
    }).limit(20).populate({ path: "sender", select: "username email" });

    const pinnedMessages = discussions.filter((message) => message.isPinned);
    const decisions = discussions.filter((message) => message.type === "decision");

    return res.status(200).json({
        workspaces,
        pages,
        discussions,
        pinnedMessages,
        decisions,
        workspaceIds
    });
});

module.exports = router;
