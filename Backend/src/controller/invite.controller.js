const inviteService = require('../services/invite.services')
const { validationResult } = require('express-validator')
const usermodel = require('../model/user.model')


exports.sendInvite = async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    const InviteData = {
        email: req.body.email,
        role: req.body.role,
        workspaceId: req.params.workspaceId,
        senderId: req.user.id
    }
    if (InviteData.email === req.user.email) {
        return res.status(400).json({ success: false, message: "You cannot invite yourself" })
    }
   const workspace = await workspaceModel.findById(workspaceId);

    if (!workspace) {
        return res.status(404).json({
            success: false,
            message: "Workspace not found"
        });
    }

        if (
        workspace.owner.toString() !==
        req.user._id.toString()
    ) {
        return res.status(403).json({
            success: false,
            message: "Only workspace owner can invite members"
        });
    }
    try {
        const user = await usermodel.findOne({ email: InviteData.email })
        if (!user) {
            return res.status(404).json({ success: false, message: "User with this email does not exist" })
        }
        const invite = await inviteService.sendInvite(InviteData)
        return res.status(200).json({ success: true, message: "Invite sent successfully", invite })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ success: false, message: "Internal Server Error" })
    }
}

exports.getInvites = async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    try {
        const invites =
await inviteService.getInvites(
    req.params.workspaceId,
    req.user._id
);
        return res.status(200).json({ success: true, invites })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ success: false, message: "Internal Server Error" })
    }
};

exports.updateInvite = async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    try {
        const invite = await inviteService.updateInvite(
            req.params.workspaceId,
            req.params.inviteId,
            req.body
        );
        return res.status(200).json({ success: true, invite });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

exports.deleteInvite = async (req, res) => {
    try {
        await inviteService.deleteInvite(
            req.params.workspaceId,
            req.params.inviteId
        );
        return res.status(200).json({ success: true, message: "Invite deleted successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};